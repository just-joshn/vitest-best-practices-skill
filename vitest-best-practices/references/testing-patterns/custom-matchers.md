<!-- Verbatim excerpts from the official Vitest documentation, v5.1.1 (https://github.com/vitest-dev/vitest/tree/161e25f663a838f6a30890f8a6827ff83ff1b3c7/docs).
     Only this comment, the H1, the table of contents, and the "Source:" comments are generated. Every other line is copied from the docs.
     Root-relative links (e.g. /api/vi) resolve against https://vitest.dev. Do not edit. Regenerate with scripts/build.mjs. -->

# Custom Matchers & Assertion Helpers

## Table of Contents

1. Extending Matchers (guide/extending-matchers.md)
   - `isNot`
   - `promise`
   - `equals`
   - `customTesters`
   - `utils`
   - `currentTestName`
   - `task`
   - `testPath`
   - `environment`
   - `soft`
   - `assertion`
2. Custom Assertion Helpers (guide/recipes/custom-assertions.md)
   - Pattern
   - Composing multiple expectations
   - See also
3. Schema-Driven Assertions (guide/recipes/schema-matching.md)
   - Pattern
   - Works with any Standard Schema library
   - Verifying call arguments
   - See also
4. Type Narrowing in Tests (guide/recipes/type-narrowing.md)
   - Pattern
   - Why `toBeTruthy` doesn't narrow
   - Narrowing beyond null
   - See also

<!-- Source: https://vitest.dev/guide/extending-matchers | docs/guide/extending-matchers.md -->

# Extending Matchers

Since Vitest is compatible with both Chai and Jest, you can use either the [`chai.use`](https://www.chaijs.com/guide/plugins/) API or `expect.extend`, whichever you prefer.

This guide will explore extending matchers with `expect.extend`. If you are interested in Chai's API, check [their guide](https://www.chaijs.com/guide/plugins/).

To extend default matchers, call `expect.extend` with an object containing your matchers.

```ts
expect.extend({
  toBeFoo(received) {
    const { isNot } = this
    return {
      // do not alter your "pass" based on isNot. Vitest does it for you
      pass: received === 'foo',
      message: () => `${received} is${isNot ? ' not' : ''} foo`
    }
  }
})
```

If you are using TypeScript, you can extend default `Matchers` interface in an ambient declaration file (e.g: `vitest.d.ts`) with the code below:

```ts
import 'vitest'

declare module 'vitest' {
  interface Matchers<R, T> {
    toBeFoo: () => R
  }
}
```

`R` is the assertion return type, and `T` is the type of the received value.

Return `R` from matchers that run synchronously. This makes the return type `void` for a regular assertion and `Promise<void>` when the assertion is used with `.resolves`, `.rejects`, [`expect.poll`](/api/expect#poll), or [`expect.element`](/api/browser/assertions). You can use `T` when an expected argument should have the same type as the received value:

```ts
declare module 'vitest' {
  interface Matchers<R, T> {
    toEqualTyped: (expected: T) => R
  }
}
```

::: tip
Importing `vitest` makes TypeScript think this is an ES module file, type declaration won't work without it.
:::

Extending the `Matchers` interface will add a type to `expect.extend`, `expect().*`, and `expect.*` methods at the same time.

::: warning
Don't forget to include the ambient declaration file in your `tsconfig.json`.
:::

The return value of a matcher should be compatible with the following types:

```ts
interface SyncMatcherResult {
  pass: boolean
  message: () => string
  // If you pass these, they will automatically appear inside a diff when
  // the matcher does not pass, so you don't need to print the diff yourself
  actual?: unknown
  expected?: unknown
  meta?: object
}

type MatcherResult = SyncMatcherResult | Promise<SyncMatcherResult>
```

::: warning
If a matcher implementation is asynchronous, declare its return type as `Promise<void>` instead of `R` and don't forget to `await` it in the test:

```ts
expect.extend({
  async toBeAsyncAssertion(received) {
    return {
      pass: received === 'foo',
      message: () => `expected ${received} to be foo`,
    }
  }
})

declare module 'vitest' {
  interface Matchers<R, T> {
    toBeAsyncAssertion: () => Promise<void>
  }
}

await expect('foo').toBeAsyncAssertion()
```

:::

The first argument inside a matcher's function is the received value (the one inside `expect(received)`). The rest are arguments passed directly to the matcher. Since version 4.1, Vitest exposes several types that can be used by your custom matcher:

```ts
import type {
  // the function type
  Matcher,
  // the return value
  MatcherResult,
  // state available as `this`
  MatcherState,
} from 'vitest'
import { expect } from 'vitest'

// a simple matcher, using "function" to have access to "this"
const customMatcher: Matcher = function (received) {
  // ...
}

// a matcher with arguments
const customMatcher: Matcher<MatcherState, [arg1: unknown, arg2: unknown]> = function (received, arg1, arg2) {
  // ...
}

// a matcher with custom annotations
function customMatcher(this: MatcherState, received: unknown, arg1: unknown, arg2: unknown): MatcherResult {
  // ...
  return {
    pass: false,
    message: () => 'something went wrong!',
  }
}

expect.extend({ customMatcher })
```

::: tip
To build custom **snapshot matchers** (wrappers around `toMatchSnapshot()` / `toMatchInlineSnapshot()` / `toMatchFileSnapshot()`), use `Snapshots` exported from `vitest`. See [Custom Snapshot Matchers](/guide/snapshot#custom-snapshot-matchers).
:::

Matcher function has access to `this` context with the following properties:

## `isNot`

Returns true, if matcher was called on `not` (`expect(received).not.toBeFoo()`). You do not need to respect it, Vitest will reverse the value of `pass` automatically.

## `promise`

If matcher was called on `resolved/rejected`, this value will contain the name of modifier. Otherwise, it will be an empty string.

## `equals`

This is a utility function that allows you to compare two values. It will return `true` if values are equal, `false` otherwise. This function is used internally for almost every matcher. It supports objects with asymmetric matchers by default.

## `customTesters`

Equality testers to pass to `equals`, including ones registered with [`expect.addEqualityTesters`](/api/expect#expect-addequalitytesters).

`equals` alone does not compare the contents of `Map` and `Set`. To get the same equality as `toEqual`, add `this.utils.iterableEquality`:

```ts
expect.extend({
  toMyEqual(received: unknown, expected: unknown) {
    const pass = this.equals(received, expected, [...this.customTesters, this.utils.iterableEquality])
    return {
      pass,
      message: () => `expected ${this.utils.printReceived(received)} to equal ${this.utils.printExpected(expected)}`,
    }
  },
})
```

## `utils`

This contains a set of utility functions that you can use to display messages.

`this` context also contains information about the current test. You can also get it by calling `expect.getState()`. The most useful properties are:

## `currentTestName`

Full name of the current test (including describe block).

## `task` <Advanced /> <Version>4.1.0</Version> {#task}

Contains a reference to [the `Test` runner task](/api/advanced/runner#tasks) when available.

::: warning
When using the global `expect` with concurrent tests, `this.task` is `undefined`. Use `context.expect` instead to ensure `task` is available in custom matchers.
:::

## `testPath`

File path to the current test.

## `environment`

The name of the current [`environment`](/config/environment) (for example, `jsdom`).

## `soft`

Was assertion called as a [`soft`](/api/expect#soft) one. You don't need to respect it, Vitest will always catch the error.

## `assertion` <Advanced /> <Version>5.0.0</Version> {#assertion}

The underlying [Chai assertion](https://www.chaijs.com/guide/plugins/) object. This is the same instance that Chai plugins receive, giving you access to Chai's flag system and chainable methods. This can be useful for building custom matchers that need to interact with Chai's internals.

::: tip
These are not all of the available properties, only the most useful ones. The other state values are used by Vitest internally.
:::

<!-- Source: https://vitest.dev/guide/recipes/custom-assertions | docs/guide/recipes/custom-assertions.md -->

# Custom Assertion Helpers

Reusable assertion helpers make tests easier to read, at the cost of stack traces. When an assertion fails inside a helper, the trace points at the line inside the helper rather than the test that called it. With the same helper used across many tests, the stack trace alone doesn't identify which call site failed.

[`vi.defineHelper`](/api/vi#vi-defineHelper) <Version>4.1.0</Version> wraps a function so Vitest strips its internals from the stack and points the error back at the call site instead.

## Pattern

```ts
import { expect, test, vi } from 'vitest'

const assertPair = vi.defineHelper((a: unknown, b: unknown) => {
  expect(a).toEqual(b) // ❌ failure does NOT point here
})

test('example', () => {
  assertPair('left', 'right') // ✅ failure points here
})
```

When `assertPair` fails, the diff and stack frame surface the test line that called it. That's the same behaviour built-in matchers give you.

## Composing multiple expectations

The same wrapper works for helpers that bundle several assertions:

```ts
import { expect, test, vi } from 'vitest'

const expectValidUser = vi.defineHelper((user: unknown) => {
  expect(user).toHaveProperty('id')
  expect(user).toHaveProperty('email')
  expect(user.email).toMatch(/@/)
})

test('returns a valid user', async () => {
  const user = await fetchUser('alice')
  expectValidUser(user)
})
```

A failure in any of the inner `expect` calls is reported against the `expectValidUser(user)` line in the test.

Reach for `defineHelper` whenever a reusable check calls `expect` more than once, whether that's a domain-specific helper like `expectValidJWT` or any block of `expect` calls you'd otherwise inline into every test.

For asymmetric matchers and custom matchers attached to `expect.extend`, see [Extending Matchers](/guide/extending-matchers).

## See also

- [`vi.defineHelper`](/api/vi#vi-defineHelper)
- [Extending Matchers](/guide/extending-matchers)

<!-- Source: https://vitest.dev/guide/recipes/schema-matching | docs/guide/recipes/schema-matching.md -->

# Schema-Driven Assertions

If your project already validates data with [Zod](https://zod.dev), [Valibot](https://valibot.dev), or [ArkType](https://arktype.io), those schemas already describe what a valid value looks like. Reusing them in tests is more direct than duplicating shape checks across `toEqual` and `toMatchObject`.

[`expect.schemaMatching`](/api/expect#expect-schemamatching) <Version>4.0.0</Version> is an asymmetric matcher that takes any [Standard Schema v1](https://standardschema.dev) object and passes if the value conforms to it.

## Pattern

```ts
import { expect, test } from 'vitest'
import { z } from 'zod'

test('email validation', () => {
  const user = { email: 'john@example.com' }

  expect(user).toEqual({
    email: expect.schemaMatching(z.string().email()),
  })
})
```

`expect.schemaMatching` is an asymmetric matcher, so it composes inside any equality check the same way `expect.any` or `expect.stringMatching` do:

- `toEqual` / `toStrictEqual`
- `toMatchObject`
- `toContainEqual`
- `toThrow`
- `toHaveBeenCalledWith`
- `toHaveReturnedWith`
- `toHaveBeenResolvedWith`

## Works with any Standard Schema library

```ts
import { expect, test } from 'vitest'
import { z } from 'zod'
import * as v from 'valibot'
import { type } from 'arktype'

const user = { email: 'john@example.com' }

// Zod
expect(user).toEqual({
  email: expect.schemaMatching(z.string().email()),
})

// Valibot
expect(user).toEqual({
  email: expect.schemaMatching(v.pipe(v.string(), v.email())),
})

// ArkType
expect(user).toEqual({
  email: expect.schemaMatching(type('string.email')),
})
```

## Verifying call arguments

A common use is asserting that a mock was called with data that conforms to a schema, without spelling out every field:

```ts
import { expect, test, vi } from 'vitest'
import { z } from 'zod'

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  createdAt: z.date(),
})

test('persists a valid user', () => {
  const repo = { save: vi.fn() }
  registerUser(repo, { email: 'a@b.com' })

  expect(repo.save).toHaveBeenCalledWith(expect.schemaMatching(UserSchema))
})
```

Reach for `schemaMatching` when you already have a schema for the value and would otherwise spell out every property by hand. It's especially useful for assertions over generated fields like UUIDs or timestamps, where you can validate the format without predicting the exact value.

## See also

- [`expect.schemaMatching`](/api/expect#expect-schemamatching)
- [Standard Schema](https://standardschema.dev)
- [Asymmetric Matchers](/api/expect)

<!-- Source: https://vitest.dev/guide/recipes/type-narrowing | docs/guide/recipes/type-narrowing.md -->

# Type Narrowing in Tests

Tests deal with possibly-null values everywhere. `document.querySelector` returns `Element | null`, `Map.get(key)` returns `T | undefined`, and similar optional shapes show up throughout. The usual workarounds in test code are an unsafe cast with `as`, a non-null assertion with `!` on every access, or a runtime check like `expect(x).toBeTruthy()` that throws when the value is missing. All three add noise, and the runtime check is actively misleading because it doesn't narrow the type the way it looks like it should.

[`expect.assert`](/api/expect#assert) <Version>4.0.0</Version> throws at runtime and narrows the TypeScript type. The same call replaces all three.

## Pattern

```ts
import { expect, test } from 'vitest'

test('reads stored user', () => {
  const cache = new Map<string, { id: string; name: string }>()
  cache.set('alice', { id: '1', name: 'Alice' })

  const user = cache.get('alice') // typed as `{ id, name } | undefined`
  expect.assert(user) // throws if undefined, narrows below
  expect(user.name).toBe('Alice') // no `!`, no `as`, type is `{ id, name }`
})
```

The same shape collapses any "look up a value, check it exists, then use it" sequence:

```ts
const job = queue.find(j => j.id === 'build-42') // Job | undefined
expect.assert(job)
job.cancel() // narrowed to Job
```

## Why `toBeTruthy` doesn't narrow

`expect(x).toBeTruthy()` and `expect(x).toBeDefined()` throw at runtime when the value is missing, so the test fails the way you want. They don't narrow the type, though, because their TypeScript signature returns `void` rather than the special `asserts` form.

`expect.assert` is typed as an assertion function, so the same call serves both jobs.

## Narrowing beyond null

`expect.assert` accepts any boolean expression and applies the same narrowing TypeScript would do for an `if` branch. That covers `typeof` and `instanceof` checks:

```ts
expect.assert(typeof input === 'string')
input.toUpperCase() // input is `string`

expect.assert(error instanceof MyError)
expect(error.code).toBe('E_FOO') // error is `MyError`
```

For common shapes there are pre-built helpers from chai's [`assert` API](/api/assert), reachable via the same `expect.assert` namespace:

```ts
expect.assert.isDefined(maybeUser) // narrows away `undefined`
expect.assert.isString(input) // narrows to string
expect.assert.instanceOf(error, MyError) // narrows to MyError
```

## See also

- [`expect.assert`](/api/expect#assert)
- [Chai `assert` API](/api/assert)
- [Waiting for Async Conditions](/guide/recipes/wait-for)
