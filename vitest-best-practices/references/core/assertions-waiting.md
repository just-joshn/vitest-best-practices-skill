<!-- Verbatim excerpts from the official Vitest documentation, v5.1.1 (https://github.com/vitest-dev/vitest/tree/161e25f663a838f6a30890f8a6827ff83ff1b3c7/docs).
     Only this comment, the H1, the table of contents, and the "Source:" comments are generated. Every other line is copied from the docs.
     Root-relative links (e.g. /api/vi) resolve against https://vitest.dev. Do not edit. Regenerate with scripts/build.mjs. -->

# Assertions & Waiting

## Table of Contents

1. Using Matchers (guide/learn/matchers.md)
   - Common Matchers
   - Truthiness
   - Numbers
   - Strings
   - Arrays and Iterables
   - Objects
   - Asymmetric Matchers
   - Exceptions
   - Soft Assertions
2. Testing Asynchronous Code (guide/learn/async.md)
   - Async/Await
   - Resolves and Rejects
   - Assertion Counting
   - Callbacks
   - Timeouts
   - Unhandled Rejections
3. Waiting for Async Conditions (guide/recipes/wait-for.md)
   - `expect.poll`: retry an assertion
   - `vi.waitFor`: wait and capture the value
   - `vi.waitUntil`: poll until truthy, fail fast on errors
   - Picking between them
   - Fake timers
   - See also

<!-- Source: https://vitest.dev/guide/learn/matchers | docs/guide/learn/matchers.md -->

# Using Matchers

Vitest uses `expect` with "matchers" to assert that values meet certain conditions. This page covers the matchers you'll use most often. For the complete list, see the [Expect API Reference](/api/expect).

## Common Matchers

The simplest way to test a value is with exact equality. When you write `expect(2 + 2).toBe(4)`, the [`toBe`](/api/expect#tobe) matcher checks that the value is exactly `4` using [`Object.is`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is).

```js
import { expect, test } from 'vitest'

test('two plus two is four', () => {
  expect(2 + 2).toBe(4)
})
```

This works great for primitive values like numbers, strings, and booleans. But when you're comparing objects, `toBe` checks _identity_ (whether they're the exact same object in memory), not whether they have the same shape. That's where [`toEqual`](/api/expect#toequal) comes in. It recursively compares every field of an object or element of an array, ignoring object identity:

```js
test('object assignment', () => {
  const data = { one: 1 }
  data.two = 2

  expect(data).toEqual({ one: 1, two: 2 })
})
```

Here's an example that shows the difference more clearly. Two objects with the same content are `toEqual` but not `toBe`:

```js
test('toBe vs toEqual', () => {
  const a = { name: 'Alice' }
  const b = { name: 'Alice' }

  // These are different objects in memory
  expect(a).not.toBe(b)

  // But they have the same structure
  expect(a).toEqual(b)
})
```

There's also [`toStrictEqual`](/api/expect#tostrictequal), which is stricter than `toEqual` in three ways: it checks `undefined` properties, distinguishes sparse arrays from `undefined` values, and verifies that objects have the same type (not just the same shape):

```js
test('toEqual vs toStrictEqual', () => {
  // toEqual ignores undefined properties
  expect({ a: 1 }).toEqual({ a: 1, b: undefined })

  // toStrictEqual catches them
  expect({ a: 1 }).not.toStrictEqual({ a: 1, b: undefined })

  // toEqual doesn't check object types
  class User {
    constructor(name) {
      this.name = name
    }
  }
  expect(new User('Alice')).toEqual({ name: 'Alice' })
  expect(new User('Alice')).not.toStrictEqual({ name: 'Alice' })
})
```

::: tip
A good rule of thumb: use `toBe` for primitives (numbers, strings, booleans), `toEqual` for comparing structure, and `toStrictEqual` when you also care about types and explicit `undefined` values.
:::

You can also negate any matcher by inserting `.not` before it. This is useful when you want to verify that something is _not_ the case:

```js
test('adding positive numbers is not zero', () => {
  expect(1 + 2).not.toBe(0)
})
```

## Truthiness

In tests you sometimes need to distinguish between `undefined`, `null`, and `false`. Other times you don't care about the exact value and just want to know if something is truthy or falsy. Vitest provides matchers for both situations:

- [`toBeNull`](/api/expect#tobenull) matches only `null`
- [`toBeUndefined`](/api/expect#tobeundefined) matches only `undefined`
- [`toBeDefined`](/api/expect#tobedefined) is the opposite of `toBeUndefined`. It passes for anything that isn't `undefined`
- [`toBeTruthy`](/api/expect#tobetruthy) matches anything that an `if` statement would treat as true
- [`toBeFalsy`](/api/expect#tobefalsy) matches anything that an `if` statement would treat as false

You should pick the matcher that most precisely describes what you're checking. Using `toBeTruthy` when you really mean `toBeDefined` can hide bugs, because `0` and `""` are both defined but falsy.

```js
test('null checks', () => {
  const n = null

  expect(n).toBeNull()
  expect(n).toBeDefined()
  expect(n).toBeFalsy()
  expect(n).not.toBeTruthy()
  expect(n).not.toBeUndefined()
})

test('zero', () => {
  const z = 0

  expect(z).toBeDefined() // passes: 0 is defined
  expect(z).toBeFalsy() // passes: 0 is falsy
  expect(z).not.toBeNull() // passes: 0 is not null
})
```

## Numbers

Most number comparisons are straightforward. Vitest provides the matchers you'd expect for greater-than, less-than, and equality checks:

```js
test('number comparisons', () => {
  const value = 2 + 2

  expect(value).toBeGreaterThan(3)
  expect(value).toBeGreaterThanOrEqual(3.5)
  expect(value).toBeLessThan(5)
  expect(value).toBeLessThanOrEqual(4.5)

  // For exact equality, both toBe and toEqual work the same for numbers
  expect(value).toBe(4)
  expect(value).toEqual(4)
})
```

There is one common gotcha with floating point arithmetic. In JavaScript, `0.1 + 0.2` doesn't equal `0.3` exactly (it's `0.30000000000000004`). This means a `toBe(0.3)` check will fail. Use [`toBeCloseTo`](/api/expect#tobecloseto) instead, which compares numbers within a small rounding error:

```js
test('adding floating point numbers', () => {
  const value = 0.1 + 0.2

  // This won't work because of floating point rounding
  // expect(value).toBe(0.3)

  // This works
  expect(value).toBeCloseTo(0.3)
})
```

## Strings

You can test strings against regular expressions with [`toMatch`](/api/expect#tomatch). This is especially handy when you care about a pattern rather than an exact value, like checking that an error message contains a certain word or that a URL matches a particular format:

```js
test('there is no I in team', () => {
  expect('team').not.toMatch(/I/)
})

test('version string matches semver format', () => {
  expect('vitest@1.0.0').toMatch(/vitest@\d+\.\d+\.\d+/)
})
```

## Arrays and Iterables

[`toContain`](/api/expect#tocontain) checks that an array (or any iterable, like a `Set`) includes a particular item. It uses `===` for comparison, so it works well for primitives:

```js
test('the shopping list has milk in it', () => {
  const shoppingList = ['milk', 'bread', 'eggs', 'butter']

  expect(shoppingList).toContain('milk')
  expect(new Set(shoppingList)).toContain('milk')
})
```

If you need to check that an array contains an object with a particular structure, use [`toContainEqual`](/api/expect#tocontainequal) instead. It works like `toEqual` but for individual items inside an array.

## Objects

When testing objects, you often want to check only a few important fields without specifying every property. [`toMatchObject`](/api/expect#tomatchobject) lets you do exactly that. It verifies that the object contains at least the properties you specify, and ignores any additional ones:

```js
test('user has expected fields', () => {
  const user = {
    id: 1,
    name: 'Alice',
    email: 'alice@example.com',
    createdAt: '2024-01-01'
  }

  // We only care about name and email here
  expect(user).toMatchObject({
    name: 'Alice',
    email: 'alice@example.com',
  })
})
```

For checking individual properties, especially nested ones, [`toHaveProperty`](/api/expect#tohaveproperty) is more readable. You pass a dot-separated path and optionally an expected value:

```js
test('object has property', () => {
  const user = {
    name: 'Alice',
    address: { city: 'Paris', zip: '75001' }
  }

  expect(user).toHaveProperty('name')
  expect(user).toHaveProperty('name', 'Alice')
  expect(user).toHaveProperty('address.city', 'Paris')
  expect(user).toHaveProperty('address.zip')
})
```

## Asymmetric Matchers

Sometimes you don't know the exact value, but you know its type or shape. Asymmetric matchers let you describe what a value should _look like_ without pinning down the exact content. They work inside any matcher that does deep comparison, like `toEqual` or `toMatchObject`:

```js
test('user has the right shape', () => {
  const user = createUser('Alice')

  expect(user).toEqual({
    id: expect.any(Number),
    name: 'Alice',
    email: expect.stringContaining('@'),
    roles: expect.arrayContaining(['viewer']),
  })
})
```

The most common asymmetric matchers are:

- [`expect.any(Constructor)`](/api/expect#expect-any) matches any value created with the given constructor (e.g., `Number`, `String`, `Array`)
- [`expect.stringContaining(str)`](/api/expect#expect-stringcontaining) matches a string that includes the given substring
- [`expect.stringMatching(regex)`](/api/expect#expect-stringmatching) matches a string against a regular expression
- [`expect.arrayContaining(arr)`](/api/expect#expect-arraycontaining) matches an array that includes all items in the expected array (order doesn't matter, extra items are allowed)
- [`expect.objectContaining(obj)`](/api/expect#expect-objectcontaining) matches an object that includes at least the specified properties

## Exceptions

To verify that a function throws an error, use [`toThrow`](/api/expect#tothrow). You need to wrap the call in another function so that Vitest can catch the error instead of letting it crash the test:

```js
function compileCode(code) {
  if (code === '') {
    throw new Error('Cannot compile empty string')
  }
  return code
}

test('compiling an empty string throws', () => {
  // Check that it throws at all
  expect(() => compileCode('')).toThrow()

  // Check the error message
  expect(() => compileCode('')).toThrow('Cannot compile empty string')

  // Check the message with a regex
  expect(() => compileCode('')).toThrow(/empty string/)
})
```

::: tip
The wrapping function `() => compileCode('')` is important. If you wrote `expect(compileCode('')).toThrow()`, the error would be thrown _before_ `expect` gets a chance to catch it, and the test would fail with an unhandled error instead.
:::

## Soft Assertions

Normally, a failing assertion stops the test immediately. That's useful most of the time, but sometimes you want to check several independent things and see all the failures at once rather than fixing them one by one.

[`expect.soft`](/api/expect#soft) does exactly that. It records the failure but lets the test keep running:

```js
test('check multiple fields', () => {
  const user = { name: 'Alice', age: 30, role: 'admin' }

  expect.soft(user.name).toBe('Alice')
  expect.soft(user.age).toBe(25) // this fails but execution continues
  expect.soft(user.role).toBe('admin')
  // the test report will show that age didn't match
})
```

This is especially useful for validating the shape of an API response or a complex object where multiple fields might be wrong at the same time.

<!-- Source: https://vitest.dev/guide/learn/async | docs/guide/learn/async.md -->

# Testing Asynchronous Code

JavaScript code frequently runs asynchronously. Whether you're fetching data, reading files, or waiting on timers, Vitest needs to know when the code it is testing has completed before moving on to the next test. Here are the patterns you'll use most often.

## Async/Await

The most straightforward approach is to make your test function `async`. Vitest will automatically wait for the returned promise to resolve before considering the test complete. If the promise rejects, the test fails with the rejection reason.

```js
import { expect, test } from 'vitest'

function fetchUser(id) {
  return Promise.resolve({ id, name: 'Alice' })
}

test('fetches user by id', async () => {
  const user = await fetchUser(1)
  expect(user.name).toBe('Alice')
})
```

This is the pattern you'll use the vast majority of the time. It reads just like synchronous code, and errors propagate naturally through `await`.

## Resolves and Rejects

Sometimes you'd rather assert on a promise directly instead of `await`-ing it into a variable first. The [`.resolves`](/api/expect#resolves) and [`.rejects`](/api/expect#rejects) helpers let you do this. They unwrap the promise and then apply the matcher to the resolved or rejected value:

```js
test('resolves to Alice', async () => {
  await expect(fetchUser(1)).resolves.toMatchObject({ name: 'Alice' })
})

test('rejects with an error', async () => {
  await expect(fetchInvalidUser()).rejects.toThrow('User not found')
})
```

::: warning
Don't forget the `await` before `expect`. Vitest will detect unawaited assertions and fail the test at the end of it.
:::

## Assertion Counting

With async code, there's a subtle risk: an assertion inside a callback or `.then()` chain might never execute, and the test would still pass because no assertion failed. [`expect.hasAssertions()`](/api/expect#hasassertions) guards against this by verifying that at least one assertion ran during the test:

```js
test('callback is invoked', async () => {
  expect.hasAssertions()

  const data = await fetchData()
  data.items.forEach((item) => {
    expect(item.id).toBeDefined()
  })
  // if data.items is empty, the test fails instead of silently passing
})
```

When you know exactly how many assertions should run, [`expect.assertions(n)`](/api/expect#assertions) is more precise:

```js
test('both callbacks are called', async () => {
  expect.assertions(2)

  await Promise.all([
    fetchUser(1).then(user => expect(user.name).toBe('Alice')),
    fetchUser(2).then(user => expect(user.name).toBe('Bob')),
  ])
})
```

In most cases, `async`/`await` with direct assertions is clear enough and you don't need assertion counting. It's most useful when assertions are inside callbacks, loops, or conditional branches where you want to guarantee they actually executed.

::: tip
If you want every test in your project to require at least one assertion, enable [`expect.requireAssertions`](/config/expect#expect-requireassertions) in your config instead of adding `expect.hasAssertions()` to each test manually.
:::

## Callbacks

Some older APIs use callbacks instead of promises. Since Vitest works with promises, the simplest approach is to wrap the callback in a `Promise`:

```js
function fetchData(callback) {
  setTimeout(callback, 100, 'peanut butter')
}

test('the data is peanut butter', async () => {
  const data = await new Promise((resolve) => {
    fetchData(resolve)
  })
  expect(data).toBe('peanut butter')
})
```

This pattern works for any callback-based API. Pass `resolve` as the success callback, and the test will wait until the callback is invoked.

::: tip
Most modern Node.js APIs (such as `fs/promises` and `fetch`) support promises natively, so you can use `async`/`await` directly. The callback wrapping pattern above is mainly useful for older libraries that haven't adopted promises yet.
:::

## Timeouts

By default, each test has a 5-second timeout. If a test takes longer than that (perhaps because a promise never resolves, or a network request hangs), it will fail with a timeout error. This prevents your test suite from getting stuck indefinitely.

You can set a [custom timeout](/api/test#timeout) as the third argument to `test`, which is useful for tests that legitimately need more time:

```js
test('long-running operation', async () => {
  await someSlowOperation()
}, 10_000) // 10 seconds
```

If you find yourself needing longer timeouts across many tests, you can change the default for all tests with the [`testTimeout`](/config/testtimeout) config option:

```js [vitest.config.js]
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    testTimeout: 10_000,
  },
})
```

## Unhandled Rejections

By default, Vitest reports unhandled promise rejections as errors in the test run. If a promise rejects somewhere in your code and nothing catches it, the test run will fail, even if all your assertions passed. This is intentional: unhandled rejections usually indicate real bugs, like a forgotten `await` or a fire-and-forget promise that silently fails.

```js
test('this causes an unhandled rejection error', () => {
  // This promise rejects but is never awaited or caught
  Promise.reject(new Error('oops'))
})
```

To fix this, make sure you `await` all promises or catch expected rejections:

```js
test('handle the rejection', async () => {
  // Either await the promise
  await expect(Promise.reject(new Error('oops'))).rejects.toThrow('oops')

  // Or catch it explicitly if you don't need to assert on it
  Promise.reject(new Error('expected')).catch(() => {})
})
```

If your code intentionally produces unhandled rejections, you can filter specific errors with [`onUnhandledError`](/config/onunhandlederror) or disable the check entirely with [`dangerouslyIgnoreUnhandledErrors`](/config/dangerouslyignoreunhandlederrors).

<!-- Source: https://vitest.dev/guide/recipes/wait-for | docs/guide/recipes/wait-for.md -->

# Waiting for Async Conditions

Plenty of things in tests don't happen synchronously. A server takes a moment to boot, or a DOM element renders after a microtask. Waiting with `setTimeout` tends to land on either a flaky undershoot or a wasteful long sleep, and a manual polling loop is more code than you want to write per test.

Vitest provides helpers that poll on your behalf, retrying on a fixed interval until the condition holds or a timeout elapses.

## `expect.poll`: retry an assertion

Use [`expect.poll`](/api/expect#poll) when the wait condition is an assertion. The callback returns the value to assert on, the matcher does the comparison, and Vitest retries the whole expression at each interval until the matcher passes.

```ts
import { expect, test } from 'vitest'
import { createServer } from './server.ts'

test('server starts', async () => {
  const server = createServer()

  await expect.poll(() => server.isReady, {
    timeout: 500,
    interval: 20
  }).toBe(true)
})
```

The failure message is the standard `expect` diff, with no manual `throw new Error('Server not started')` to maintain. This is the right tool for most "wait for X to become Y" cases.

`expect.poll` makes every assertion asynchronous, so the call must be awaited. Some matchers don't pair with it: snapshot matchers (which would always succeed under polling), `.resolves` and `.rejects` (the condition is already awaited), and `toThrow` (the value is resolved before the matcher sees it). For any of those, reach for `vi.waitFor` instead.

## `vi.waitFor`: wait and capture the value

[`vi.waitFor`](/api/vi#vi-waitfor) is the right tool when the wait condition is the work itself succeeding rather than an assertion you write. It runs the callback at each interval; a thrown error queues another attempt, and the first call that doesn't throw resolves the wait with whatever the callback returned.

```ts
import { expect, test, vi } from 'vitest'
import { connect, DB_URL } from './db.ts'

test('database is reachable', async () => {
  // `connect` throws ECONNREFUSED until the database accepts connections
  const client = await vi.waitFor(() => connect(DB_URL), {
    timeout: 5000,
    interval: 100,
  })

  const rows = await client.query('SELECT 1 AS ok')
  expect(rows[0].ok).toBe(1)
})
```

The throw that drives the retry comes from `connect` itself, not from an `expect` you wrote inside the callback. `expect.poll` doesn't fit this shape because it's built around assertions, and "retry until this call stops throwing and hand me the result" isn't an assertion. Wrapping the call in a `try`/`catch` to fake one would either duplicate the work after the wait or require building the retry loop by hand.

## `vi.waitUntil`: poll until truthy, fail fast on errors

Use [`vi.waitUntil`](/api/vi#vi-waituntil) for a value lookup where any thrown error should fail the test on the spot rather than be retried away. Each interval calls the callback again. A truthy return resolves the wait; a falsy return waits for the next interval. A thrown error fails the test immediately.

```ts
import { expect, test, vi } from 'vitest'
import { jobResults, startJob } from './worker.ts'

test('worker completes the job', async () => {
  startJob('build-42')

  const result = await vi.waitUntil(
    () => jobResults.get('build-42'),
    { timeout: 5000, interval: 100 },
  )

  expect(result.status).toBe('ok')
  expect(result.steps).toHaveLength(4)
})
```

`jobResults.get('build-42')` returns `JobResult | undefined`. `waitUntil` polls until it returns a truthy value, narrows the resolved type to `JobResult`, and hands it back for further assertions. If the lookup itself throws because of a programming error like a typo in the import, `waitUntil` surfaces the error on the first attempt rather than retrying past it.

In browser mode, prefer [`page.locator`](/api/browser/locators) and [`expect.element`](/api/browser/assertions) over `waitUntil` for DOM queries: locators retry on their own and produce richer failure messages.

## Picking between them

|                         | `expect.poll`            | `vi.waitFor`                         | `vi.waitUntil`                          |
| ----------------------- | ------------------------ | ------------------------------------ | --------------------------------------- |
| Reach for it when       | the wait is an assertion | the work might fail until it's ready | a lookup might be falsy and that's fine |
| Retries on thrown error | yes                      | yes                                  | no, fails fast                          |
| Resolves with           | the assertion            | callback's return value              | callback's return value                 |

Each of these accepts `{ timeout, interval }` options, defaulting to a 1000 ms timeout and 50 ms intervals. `vi.waitFor` and `vi.waitUntil` also accept a number in place of the options object as shorthand for the timeout.

## Fake timers

If [`vi.useFakeTimers`](/api/vi#vi-usefaketimers) is active, `vi.waitFor` automatically calls `vi.advanceTimersByTime(interval)` between attempts. That keeps `setTimeout`-based code under test reachable without leaking real time into the test.

## See also

- [`expect.poll`](/api/expect#poll)
- [`vi.waitFor`](/api/vi#vi-waitfor)
- [`vi.waitUntil`](/api/vi#vi-waituntil)
- [`vi.useFakeTimers`](/api/vi#vi-usefaketimers)
