<!-- Verbatim excerpts from the official Vitest documentation, v5.1.1 (https://github.com/vitest-dev/vitest/tree/161e25f663a838f6a30890f8a6827ff83ff1b3c7/docs).
     Only this comment, the H1, the table of contents, and the "Source:" comments are generated. Every other line is copied from the docs.
     Root-relative links (e.g. /api/vi) resolve against https://vitest.dev. Do not edit. Regenerate with scripts/build.mjs. -->

# Mocking

## Table of Contents

1. Mocking (guide/mocking.md)
   - Cheat Sheet
2. Mock Functions (guide/learn/mock-functions.md)
   - Creating Mock Functions
   - Mock Return Values
   - Mock Implementation
   - Inspecting Calls
   - Spying on Methods
   - Resetting Mocks
   - Mocking Modules

<!-- Source: https://vitest.dev/guide/mocking | docs/guide/mocking.md -->

# Mocking

::: tip
New to mocking? Start with the [Mock Functions](/guide/learn/mock-functions) tutorial for a hands-on introduction to `vi.fn`, `vi.spyOn`, and `vi.mock`.
:::

When writing tests it's only a matter of time before you need to create a "fake" version of an internal — or external — service. This is commonly referred to as **mocking**. Vitest provides utility functions to help you out through its `vi` helper. You can import it from `vitest` or access it globally if [`global` configuration](/config/globals) is enabled.

::: warning
Always remember to clear or restore mocks before or after each test run to undo mock state changes between runs! See [`mockReset`](/api/mock#mockreset) docs for more info.
:::

If you are not familiar with `vi.fn`, `vi.mock` or `vi.spyOn` methods, check the [API section](/api/vi) first.

Vitest has a comprehensive list of guides regarding mocking:

- [Mocking Classes](/guide/mocking/classes.md)
- [Mocking Dates](/guide/mocking/dates.md)
- [Mocking the File System](/guide/mocking/file-system.md)
- [Mocking Functions](/guide/mocking/functions.md)
- [Mocking Globals](/guide/mocking/globals.md)
- [Mocking Modules](/guide/mocking/modules.md)
- [Mocking Requests](/guide/mocking/requests.md)
- [Mocking Timers](/guide/mocking/timers.md)

For a simpler and quicker way to get started with mocking, you can check the Cheat Sheet below.

## Cheat Sheet

I want to…

### Mock exported variables

```js [example.js]
export const getter = 'variable'
```

```ts [example.test.ts]
import * as exports from './example.js'

vi.spyOn(exports, 'getter', 'get').mockReturnValue('mocked')
```

::: warning
This will not work in the Browser Mode. For a workaround, see [Limitations](/guide/browser/#spying-on-module-exports).
:::

### Mock an exported function

1. Example with `vi.mock`:

::: warning
Don't forget that a `vi.mock` call is hoisted to top of the file. It will always be executed before all imports.
:::

```ts [example.js]
export function method() {}
```

```ts
import { method } from './example.js'

vi.mock('./example.js', () => ({
  method: vi.fn()
}))
```

2. Example with `vi.spyOn`:

```ts
import * as exports from './example.js'

vi.spyOn(exports, 'method').mockImplementation(() => {})
```

::: warning
`vi.spyOn` example will not work in the Browser Mode. For a workaround, see [Limitations](/guide/browser/#spying-on-module-exports).
:::

### Mock an exported class implementation

1. Example with a fake `class`:

```ts [example.js]
export class SomeClass {}
```

```ts
import { SomeClass } from './example.js'

vi.mock(import('./example.js'), () => {
  const SomeClass = vi.fn(class FakeClass {
    someMethod = vi.fn()
  })
  return { SomeClass }
})
```

2. Example with `vi.spyOn`:

```ts
import * as mod from './example.js'

vi.spyOn(mod, 'SomeClass').mockImplementation(class FakeClass {
  someMethod = vi.fn()
})
```

::: warning
`vi.spyOn` example will not work in the Browser Mode. For a workaround, see [Limitations](/guide/browser/#spying-on-module-exports).
:::

### Spy on an object returned from a function

1. Example using cache:

```ts [example.js]
export function useObject() {
  return { method: () => true }
}
```

```ts [useObject.js]
import { useObject } from './example.js'

const obj = useObject()
obj.method()
```

```ts [useObject.test.js]
import { useObject } from './example.js'

vi.mock(import('./example.js'), () => {
  let _cache
  const useObject = () => {
    if (!_cache) {
      _cache = {
        method: vi.fn(),
      }
    }
    // now every time that useObject() is called it will
    // return the same object reference
    return _cache
  }
  return { useObject }
})

const obj = useObject()
// obj.method was called inside some-path
expect(obj.method).toHaveBeenCalled()
```

### Mock part of a module

```ts
import { mocked, original } from './some-path.js'

vi.mock(import('./some-path.js'), async (importOriginal) => {
  const mod = await importOriginal()
  return {
    ...mod,
    mocked: vi.fn()
  }
})
original() // has original behaviour
mocked() // is a spy function
```

::: warning
Don't forget that this only [mocks _external_ access](/guide/mocking/modules#mocking-modules-pitfalls). In this example, if `original` calls `mocked` internally, it will always call the function defined in the module, not in the mock factory.
:::

### Mock the current date

To mock `Date` and `Temporal`'s time, you can use `vi.setSystemTime` helper function. This value will **not** automatically reset between different tests.

Beware that using `vi.useFakeTimers` also changes the `Date`'s time.

```ts
const mockDate = new Date(2022, 0, 1)
vi.setSystemTime(mockDate)
const now = new Date()
expect(now.valueOf()).toBe(mockDate.valueOf())
const nowInstant = Temporal.Now.instant()
expect(nowInstant.epochMilliseconds).toBe(mockDate.valueOf())
// reset mocked time
vi.useRealTimers()
```

### Mock a global variable

You can set global variable by assigning a value to `globalThis` or using [`vi.stubGlobal`](/api/vi#vi-stubglobal) helper. When using `vi.stubGlobal`, it will **not** automatically reset between different tests, unless you enable [`unstubGlobals`](/config/unstubglobals) config option or call [`vi.unstubAllGlobals`](/api/vi#vi-unstuballglobals).

```ts
vi.stubGlobal('__VERSION__', '1.0.0')
expect(__VERSION__).toBe('1.0.0')
```

### Mock `import.meta.env`

1. To change environmental variable, you can just assign a new value to it.

::: warning
The environmental variable value will **_not_** automatically reset between different tests.
:::

```ts
import { beforeEach, expect, it } from 'vitest'

// you can reset it in beforeEach hook manually
const originalViteEnv = import.meta.env.VITE_ENV

beforeEach(() => {
  import.meta.env.VITE_ENV = originalViteEnv
})

it('changes value', () => {
  import.meta.env.VITE_ENV = 'staging'
  expect(import.meta.env.VITE_ENV).toBe('staging')
})
```

2. If you want to automatically reset the value(s), you can use the `vi.stubEnv` helper with the [`unstubEnvs`](/config/unstubenvs) config option enabled (or call [`vi.unstubAllEnvs`](/api/vi#vi-unstuballenvs) manually in a `beforeEach` hook):

```ts
import { expect, it, vi } from 'vitest'

// before running tests "VITE_ENV" is "test"
import.meta.env.VITE_ENV === 'test'

it('changes value', () => {
  vi.stubEnv('VITE_ENV', 'staging')
  expect(import.meta.env.VITE_ENV).toBe('staging')
})

it('the value is restored before running an other test', () => {
  expect(import.meta.env.VITE_ENV).toBe('test')
})
```

```ts [vitest.config.ts]
export default defineConfig({
  test: {
    unstubEnvs: true,
  },
})
```

<!-- Source: https://vitest.dev/guide/learn/mock-functions | docs/guide/learn/mock-functions.md -->

# Mock Functions

When writing tests, you often need to replace a real function or module with a controlled version. This is called **mocking**. There are several reasons you might want to do this: maybe the real function makes network requests that would slow down your tests, or maybe you need to simulate an error that's hard to trigger with real code. Mock functions let you control what a dependency returns, observe how it was called, and isolate the code under test from side effects.

Vitest provides mocking utilities through the [`vi`](/api/vi) object.

## Creating Mock Functions

The simplest way to create a mock is with [`vi.fn()`](/api/vi#vi-fn). This gives you a function that does nothing by default (returns `undefined`), but tracks every call made to it:

```js
import { expect, test, vi } from 'vitest'

test('mock function basics', () => {
  const getApples = vi.fn()

  // Call it
  getApples()

  // Check it was called
  expect(getApples).toHaveBeenCalled()
  expect(getApples).toHaveBeenCalledTimes(1)

  // By default, a mock returns undefined
  expect(getApples()).toBeUndefined()
})
```

## Mock Return Values

A mock that always returns `undefined` isn't very useful on its own. You'll usually want to control what it returns so you can test how your code reacts to different values:

```js
import { expect, test, vi } from 'vitest'

test('mock return values', () => {
  const getApples = vi.fn()

  // Always return this value
  getApples.mockReturnValue(10)
  expect(getApples()).toBe(10)

  // Return this value only once, then fall back to the default
  getApples.mockReturnValueOnce(20)
  expect(getApples()).toBe(20) // 20 (one-time)
  expect(getApples()).toBe(10) // back to default
})
```

If the function you're mocking is async, use [`mockResolvedValue`](/api/mock#mockresolvedvalue) and [`mockRejectedValue`](/api/mock#mockrejectedvalue) to control the promise outcome:

```js
test('mock async return values', async () => {
  const fetchUser = vi.fn()

  fetchUser.mockResolvedValue({ name: 'Alice' })
  const user = await fetchUser()
  expect(user.name).toBe('Alice')

  fetchUser.mockRejectedValue(new Error('Not found'))
  await expect(fetchUser()).rejects.toThrow('Not found')
})
```

::: tip
`mockReturnValue` always returns the same value regardless of the arguments the mock receives. If you need argument-specific return values, [`vi.when`](/api/vi#vi-when) lets you attach different behaviors for different argument combinations without writing your own `if/else` logic. See the [Conditional Mocking](/guide/recipes/conditional-mocking) recipe for details.
:::

## Mock Implementation

Sometimes you need more than a fixed return value. You want the mock to actually do something with its arguments. [`mockImplementation`](/api/mock#mockimplementation) lets you provide a full replacement function:

```js
import { expect, test, vi } from 'vitest'

test('mock with custom implementation', () => {
  const add = vi.fn()
  add.mockImplementation((a, b) => a + b)

  expect(add(1, 2)).toBe(3)
  expect(add(10, 20)).toBe(30)
})
```

As a shorthand, you can pass the implementation directly to `vi.fn()`:

```js
const add = vi.fn((a, b) => a + b)
```

## Inspecting Calls

One of the most powerful things about mock functions is that they remember every call made to them. You can assert on how many times a function was called, what arguments it received, and what it returned:

```js
import { expect, test, vi } from 'vitest'

test('inspecting mock calls', () => {
  const greet = vi.fn()

  greet('Alice')
  greet('Bob', 'Charlie')

  // Number of calls
  expect(greet).toHaveBeenCalledTimes(2)

  // Check specific arguments
  expect(greet).toHaveBeenCalledWith('Alice')
  expect(greet).toHaveBeenCalledWith('Bob', 'Charlie')

  // Check the arguments of a specific call by position
  expect(greet).toHaveBeenNthCalledWith(1, 'Alice')
  expect(greet).toHaveBeenLastCalledWith('Bob', 'Charlie')

  // Access the raw call data
  expect(greet.mock.calls).toEqual([
    ['Alice'],
    ['Bob', 'Charlie'],
  ])
})
```

The `.mock` property gives you full access to the call history. In addition to `.mock.calls`, you can also inspect `.mock.results` to see what the mock returned (or threw) on each call:

```js
const double = vi.fn(x => x * 2)

double(5)
double(10)

expect(double.mock.results).toEqual([
  { type: 'return', value: 10 },
  { type: 'return', value: 20 },
])
```

::: warning
`.mock.calls` stores references to the arguments, not copies. If you pass an object to a mock and then mutate it afterwards, the recorded call will reflect the mutated state, not the state at the time of the call:

```js
const fn = vi.fn()
const obj = { count: 1 }

fn(obj)
obj.count = 2

// ❌ This fails! mock.calls[0][0].count is now 2, not 1
expect(fn).toHaveBeenCalledWith({ count: 1 })
```

If you need to assert on the original values, you can use `mockImplementation` to capture a clone at call time:

```js
const calls = []
const fn = vi.fn((obj) => {
  calls.push(structuredClone(obj))
})

const obj = { count: 1 }
fn(obj)
obj.count = 2

expect(calls[0]).toEqual({ count: 1 }) // ✅ passes
```

Alternatively, you can make your assertion before the mutation happens.
:::

## Spying on Methods

[`vi.spyOn`](/api/vi#vi-spyon) is different from `vi.fn()` in an important way. Instead of creating a brand new function, it wraps an _existing_ method on an object. The original implementation still works by default, but you can observe every call and optionally override the behavior:

```js
import { expect, test, vi } from 'vitest'

const calculator = {
  add(a, b) {
    return a + b
  },
}

test('spy on a method', () => {
  const spy = vi.spyOn(calculator, 'add')

  // The original implementation still works
  expect(calculator.add(1, 2)).toBe(3)

  // But we can observe calls
  expect(spy).toHaveBeenCalledWith(1, 2)
  expect(spy).toHaveBeenCalledTimes(1)
})

test('spy can override implementation', () => {
  const spy = vi.spyOn(calculator, 'add')
  spy.mockReturnValue(42)

  expect(calculator.add(1, 2)).toBe(42)
})
```

This is particularly useful when you want to verify that your code calls a method correctly without replacing the method's behavior entirely.

## Resetting Mocks

Mock functions accumulate state as tests run. They remember every call, every return value, and any custom implementation you've set. If you don't reset them between tests, this state can leak and cause confusing failures. Vitest provides three levels of cleanup:

- **[`mockClear()`](/api/mock#mockclear)** clears the recorded call history and return values, but keeps any custom implementation you've set
- **[`mockReset()`](/api/mock#mockreset)** does everything `mockClear` does, and also removes any custom implementation, returning the mock to its default state
- **[`mockRestore()`](/api/mock#mockrestore)** is specifically for spies created with `vi.spyOn`. It restores the original object method, effectively undoing the spy. On `vi.fn()` mocks, it behaves the same as `mockReset`

In practice, the easiest approach is to restore all mocks automatically after each test:

```js
import { afterEach, expect, test, vi } from 'vitest'

const calculator = {
  add: (a, b) => a + b,
}

afterEach(() => {
  vi.restoreAllMocks()
})

test('spy is restored after the test', () => {
  const spy = vi.spyOn(calculator, 'add').mockReturnValue(42)
  expect(calculator.add(1, 2)).toBe(42)
  // afterEach will restore calculator.add to the original implementation
})
```

Even better, you can configure this globally with the [`restoreMocks`](/config/restoremocks) option so you don't need the `afterEach` at all:

```js [vitest.config.js]
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    restoreMocks: true,
  },
})
```

## Mocking Modules

Sometimes you need to replace an [entire module](/guide/mocking/modules) rather than a single function. For example, a database client or a logger that you don't want running during tests. [`vi.mock`](/api/vi#vi-mock) lets you replace a module's exports with mock implementations:

```js
import { expect, test, vi } from 'vitest'
import { getUser } from './db.js'

vi.mock(import('./db.js'), () => ({
  getUser: vi.fn(),
}))

test('mock a module', () => {
  vi.mocked(getUser).mockReturnValue({ name: 'Alice' })

  const user = getUser(1)
  expect(user.name).toBe('Alice')
  expect(getUser).toHaveBeenCalledWith(1)
})
```

::: warning
[`vi.mock`](/api/vi#vi-mock) calls are hoisted to the top of the file. They run before any imports. This means the mocked version is in place by the time your test code runs.
:::

::: warning
Always pass `import('./db.js')` rather than a plain string `'./db.js'`. When you use `import()`, TypeScript can infer the module's types, so the factory function's return value is type-checked and `importOriginal` returns the correctly typed module. As a bonus, if you rename or move the file in your IDE, the import path will be updated automatically. If you use a string, you lose both the type safety and the automatic refactoring.
:::

Vitest has comprehensive guides for specific mocking scenarios:

- [Mocking Functions](/guide/mocking/functions)
- [Mocking Modules](/guide/mocking/modules)
- [Mocking Timers](/guide/mocking/timers)
- [Mocking Dates](/guide/mocking/dates)
- [Mocking Globals](/guide/mocking/globals)
- [Mocking Requests](/guide/mocking/requests)
- [Mocking the File System](/guide/mocking/file-system)
- [Mocking Classes](/guide/mocking/classes)
