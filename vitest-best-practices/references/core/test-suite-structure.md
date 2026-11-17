<!-- Verbatim excerpts from the official Vitest documentation, v5.1.1 (https://github.com/vitest-dev/vitest/tree/161e25f663a838f6a30890f8a6827ff83ff1b3c7/docs).
     Only this comment, the H1, the table of contents, and the "Source:" comments are generated. Every other line is copied from the docs.
     Root-relative links (e.g. /api/vi) resolve against https://vitest.dev. Do not edit. Regenerate with scripts/build.mjs. -->

# Test Suite Structure

## Table of Contents

1. Writing Tests (guide/learn/writing-tests.md)
   - Your First Test
   - Grouping Tests with `describe`
   - Test Files
   - Testing TypeScript
   - Reading Test Output
   - Skipping and Focusing Tests
   - Parameterized Tests
   - Using Global Imports
   - Running Tests
2. Testing in Practice (guide/learn/testing-in-practice.md)
   - What to Test
   - Structuring a Test
   - Testing Edge Cases
   - When to Mock
   - Fixing Bugs with Tests
   - Organizing Test Files
   - A Worked Example

<!-- Source: https://vitest.dev/guide/learn/writing-tests | docs/guide/learn/writing-tests.md -->

# Writing Tests

In the [Getting Started](/guide/) guide, you installed Vitest and ran your first test. This page dives deeper into how to write and organize tests in Vitest.

## Your First Test

A test verifies that a piece of code produces the expected result. In Vitest, you use the [`test`](/api/test) function to define a test, and [`expect`](/api/expect) to make assertions. Each test has a name (a string describing what it checks) and a function that contains one or more assertions. If any assertion fails, the test fails.

```js
import { expect, test } from 'vitest'

test('Math.sqrt works for perfect squares', () => {
  expect(Math.sqrt(4)).toBe(2)
  expect(Math.sqrt(144)).toBe(12)
  expect(Math.sqrt(0)).toBe(0)
})
```

::: details Use `test` or `it`?
You might also see tests written with [`it`](/api/test) instead of `test`. They behave identically. `it` is just an alias that some people prefer because it reads more naturally with a descriptive name:

```js
import { expect, it } from 'vitest'

it('should compute square roots', () => {
  expect(Math.sqrt(4)).toBe(2)
})
```

Use whichever you prefer. Both work the same way, and you can mix them freely in a project. If you want to enforce a consistent choice across your codebase, the [`consistent-test-it`](https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/consistent-test-it.md) ESLint rule (also available in [oxlint](https://oxc.rs/docs/guide/usage/linter/rules/jest/consistent-test-it.html)) can help with that.
:::

## Grouping Tests with `describe`

As your test files grow, you'll want to organize related tests together. [`describe`](/api/describe) creates a test suite, which is a named group of tests:

```js
import { describe, expect, test } from 'vitest'

describe('Math.sqrt', () => {
  test('returns the square root of perfect squares', () => {
    expect(Math.sqrt(4)).toBe(2)
    expect(Math.sqrt(9)).toBe(3)
  })

  test('returns NaN for negative numbers', () => {
    expect(Math.sqrt(-1)).toBeNaN()
  })

  test('returns 0 for 0', () => {
    expect(Math.sqrt(0)).toBe(0)
  })
})
```

You can nest `describe` blocks for further organization, but keep nesting shallow. Deeply nested tests are harder to read. A flat list of tests is often enough for simple modules, and `describe` becomes more useful when a file tests multiple functions or methods that each need their own group.

## Test Files

By default, Vitest looks for any file that contains `.test.` or `.spec.` in its name, such as `utils.test.js`, `app.spec.js`, or `math.test.jsx`. It searches in all subdirectories, so it doesn't matter where you place them.

The exact patterns are:

- `**/*.test.{ts,js,mjs,cjs,tsx,jsx}`
- `**/*.spec.{ts,js,mjs,cjs,tsx,jsx}`

There's no single "right" way to organize your test files. Some teams prefer placing tests right next to the source code they test, while others keep them in a dedicated directory. Vitest will find them either way:

```
src/
  utils.js
  utils.test.js       # co-located with the source
  __tests__/
    utils.test.js      # in a test directory
```

If the default patterns don't work for your project, you can customize which files are included with the [`include`](/config/include) and [`exclude`](/config/exclude) config options.

## Testing TypeScript

Because Vitest runs on top of Vite, TypeScript works out of the box. There's no extra compiler to install, no `ts-jest` to configure, and no separate build step for your tests. Just name your test file `.test.ts` instead of `.test.js` and start writing:

```ts
import { expect, test } from 'vitest'

interface User {
  name: string
  age: number
}

function createUser(name: string, age: number): User {
  return { name, age }
}

test('creates a user with the correct fields', () => {
  const user = createUser('Alice', 30)

  expect(user).toEqual({ name: 'Alice', age: 30 })
  expect(user.name).toBe('Alice')
})
```

You can import your production types, use generics, and write typed test utilities exactly as you would in the rest of your codebase. Vite transforms TypeScript on the fly, so tests start fast even in large projects.

::: tip
Vitest transforms TypeScript for execution but does **not** type-check your tests during the test run. This is the same trade-off Vite makes for speed: you get fast feedback in the terminal, and run `tsc` or `vitest typecheck` separately when you want full type checking. See the [Testing Types](/guide/testing-types) guide for more details.
:::

## Reading Test Output

When you run `vitest` and only a single test file matches, the output is expanded into a tree structure showing `describe` groups and individual tests along with their duration:

```ansi
 [32m✓[39m src/utils.test.js [90m(3 tests)[39m [32m5ms[39m
   [32m✓[39m Math.sqrt [32m4ms[39m
     [32m✓[39m returns the square root of perfect squares [32m2ms[39m
     [32m✓[39m returns NaN for negative numbers [32m1ms[39m
     [32m✓[39m returns 0 for 0 [32m1ms[39m

 [1mTest Files[22m  [32m1 passed[39m (1)
 [1m     Tests[22m  [32m3 passed[39m (3)
```

When multiple test files run, Vitest collapses each file into a single line to keep the output manageable:

```ansi
 [32m✓[39m src/utils.test.js [90m(3 tests)[39m [32m5ms[39m
 [32m✓[39m src/math.test.js [90m(2 tests)[39m [32m3ms[39m
 [32m✓[39m src/strings.test.js [90m(4 tests)[39m [32m7ms[39m

 [1mTest Files[22m  [32m3 passed[39m (3)
 [1m     Tests[22m  [32m9 passed[39m (9)
```

When a test fails, Vitest shows you exactly what went wrong. You'll see the expected value, the actual value, a diff highlighting the difference, and a code snippet of the surrounding lines with the failing assertion highlighted. It also includes the file and line number so you can jump straight to the source:

```ansi
 [31mFAIL[39m src/utils.test.js [2m>[22m Math.sqrt [2m>[22m returns the square root of perfect squares
[31mAssertionError: expected 3 to be 2[39m

[31m- Expected[39m
[32m+ Received[39m

  [31m2[39m
  [32m3[39m

 [2m❯[22m [36msrc/utils.test.js[39m[2m:5:28[22m
[2m      3|[22m   [34mtest[39m([32m'returns the square root of perfect squares'[39m, () => {
[2m      4|[22m     [34mexpect[39m(Math.[34msqrt[39m([34m4[39m)).[34mtoBe[39m([34m2[39m)
[2m      5|[22m     [34mexpect[39m(Math.[34msqrt[39m([34m9[39m)).[34mtoBe[39m([34m2[39m)
                                  [31m^[39m
[2m      6|[22m   })
[2m      7|[22m
```

Between the diff and the code snippet, you can usually understand what went wrong without needing to add extra `console.log` statements or open the file yourself.

## Skipping and Focusing Tests

While developing, you'll often want to run only a subset of tests. Vitest provides modifiers for this:

[`.only`](/api/test#only) tells Vitest to run only this test (or suite) and skip everything else in the file. This is useful when you're working on a specific test and don't want to wait for the entire suite to finish:

```js
test.only('focus on this test', () => {
  // only this test runs in the file
})
```

[`.skip`](/api/test#skip) does the opposite. It skips a test without removing it, which is handy when a test is temporarily broken or you want to ignore it while you work on something else:

```js
test.skip('not ready yet', () => {
  // this test is skipped
})
```

[`.todo`](/api/test#todo) lets you mark a placeholder for a test you haven't written yet. Vitest will list it in the output so you won't forget about it:

```js
test.todo('implement validation later')
```

These modifiers are great for quick, local changes while developing. For more permanent ways to filter tests (by filename, line number, or tags), see the [Test Filtering](/guide/filtering) guide.

## Parameterized Tests

When you have several test cases that only differ in their inputs and expected outputs, writing a separate `test` for each one gets repetitive. [`test.for`](/api/test#test-for) lets you define the cases as data and run the same test logic for all of them:

```js
import { expect, test } from 'vitest'

test.for([
  [1, 1, 2],
  [1, 2, 3],
  [2, 1, 3],
])('add(%i, %i) -> %i', ([a, b, expected]) => {
  expect(a + b).toBe(expected)
})
```

In the example above, the %i placeholders are replaced with the integer values from each data row. Vitest also supports other placeholder types, such as %s for strings and %f for floating-point numbers. As a result, the test runner generates test names such as add(1, 1) -> 2, add(1, 2) -> 3, and add(2, 1) -> 3.

If your cases have more than two or three values, passing objects is more readable. Use `$property` in the name to interpolate fields:

```js
test.for([
  { a: 1, b: 1, expected: 2 },
  { a: 1, b: 2, expected: 3 },
  { a: 2, b: 1, expected: 3 },
])('add($a, $b) -> $expected', ({ a, b, expected }) => {
  expect(a + b).toBe(expected)
})
```

The second argument to the test function is the [Test Context](/guide/test-context), which gives you access to fixtures, per-test `expect`, and other utilities. This is especially useful with [`test.concurrent`](/api/test#concurrent), where concurrent tests run in parallel and the global `expect` can't reliably associate a snapshot with the right test. The context-scoped `expect` solves this:

```js
test.concurrent.for([
  [1, 1],
  [1, 2],
  [2, 1],
])('add(%i, %i)', ([a, b], { expect }) => {
  expect(a + b).toMatchSnapshot()
})
```

[`describe.for`](/api/describe#describe-for) works the same way but creates a suite for each set of parameters, which is useful when multiple tests share the same parameterized setup.

::: tip
Vitest also provides [`test.each`](/api/test#each), which you may recognize from Jest. It works similarly but spreads array arguments instead of passing them as a single value, and doesn't provide access to the Test Context. It exists mainly for Jest compatibility. Prefer `test.for` in new code.
:::

## Using Global Imports

By default, you import `test`, `expect`, `describe`, and other functions from `vitest` at the top of every test file. If you'd rather use them as globals without importing (similar to how Jest works), you can enable the [`globals`](/config/globals) option in your config:

```js [vitest.config.js]
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
  },
})
```

With this enabled, you can write tests without the import line:

```js
test('no import needed', () => {
  expect(1 + 1).toBe(2)
})
```

::: tip
If you use TypeScript, add `"types": ["vitest/globals"]` to your `tsconfig.json` `compilerOptions` for proper type support.
:::

## Running Tests

Vitest runs all test files **in parallel** by default, using [child processes](/config/pool). Each test file runs in its own isolated context, so your test files don't share state with each other. This prevents tests in different files from accidentally interfering. Browser Mode is an exception: browser storage such as cookies and `localStorage` can be shared between test files (see [`contextOptions`](/config/browser/playwright#contextoptions)).

Tests **within** a single file run sequentially by default, which is usually what you want since tests in the same file often share setup code. If your tests are truly independent, you can opt into running them concurrently with [`test.concurrent`](/api/test#concurrent) to speed things up. See the [Parallelism](/guide/parallelism) guide for more details on controlling test execution.

<!-- Source: https://vitest.dev/guide/learn/testing-in-practice | docs/guide/learn/testing-in-practice.md -->

# Testing in Practice

The previous pages covered the Vitest API: assertions, mocking, snapshots, and test lifecycle hooks. This page focuses on applying those tools to real code. It covers how to decide what to test, how to structure tests effectively, and how to organize test files as a project grows.

## What to Test

When you sit down to write tests for a function or module, start by thinking about its **contract**: what does it promise to do for the code that calls it? The contract is defined by its inputs (arguments, configuration) and its outputs (return values, side effects, errors). These are the things your tests should verify.

Consider a `formatPrice` function:

```js [formatPrice.js]
export function formatPrice(amount, currency) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}
```

The contract here is: given an amount and a currency code, return a formatted price string. Good tests for this function would cover:

```js [formatPrice.test.js]
import { expect, test } from 'vitest'
import { formatPrice } from './formatPrice.js'

test('formats USD prices', () => {
  expect(formatPrice(10, 'USD')).toBe('$10.00')
})

test('formats EUR prices', () => {
  expect(formatPrice(10, 'EUR')).toBe('€10.00')
})

test('handles zero', () => {
  expect(formatPrice(0, 'USD')).toBe('$0.00')
})

test('handles negative amounts', () => {
  expect(formatPrice(-5.5, 'USD')).toBe('-$5.50')
})

test('rounds to two decimal places', () => {
  expect(formatPrice(10.999, 'USD')).toBe('$11.00')
})
```

Notice what these tests _don't_ do. They don't check which internal `Intl.NumberFormat` options were passed, or whether an intermediate variable was set. They only check the output.

::: tip
A good rule of thumb: if someone refactors the internals but the output stays the same, should the test break? If it would, you're probably testing implementation details rather than behavior.
:::

## Structuring a Test

Most tests follow a natural three-part structure, sometimes called "Arrange, Act, Assert":

1. **Set up** the data your test needs
2. **Call** the function or perform the action you're testing
3. **Check** that the result matches your expectations

```js
test('removes an item from the list', () => {
  // Set up
  const list = new ShoppingList()
  list.add('milk')
  list.add('bread')

  // Act
  list.remove('milk')

  // Check
  expect(list.getItems()).toEqual(['bread'])
})
```

You don't need comments labeling each section. The structure becomes natural once you've written a few tests. The important thing is keeping each test focused on one behavior.

### One Behavior Per Test

If you find yourself writing "and" in a test name ("formats price and handles errors and logs the result"), that's a sign you should split it into separate tests.

### Descriptive Names

Write test names that describe the behavior, not the implementation. "returns formatted price for USD" is better than "calls Intl.NumberFormat with correct options". When a test fails, the name should tell you what broke without having to read the test body.

## Testing Edge Cases

After covering the main behavior, think about the boundaries. What happens at the edges? What inputs are unusual but valid? What should happen when things go wrong?

Here's an example with a `parseAge` function that takes user input and returns a number:

```js [parseAge.js]
export function parseAge(input) {
  const age = Number(input)
  if (Number.isNaN(age) || age < 0 || age > 150) {
    throw new Error(`Invalid age: ${input}`)
  }
  return Math.floor(age)
}
```

The happy path is straightforward, but the edge cases are where bugs hide:

```js [parseAge.test.js]
import { expect, test } from 'vitest'
import { parseAge } from './parseAge.js'

test('parses a valid age', () => {
  expect(parseAge('25')).toBe(25)
})

test('rounds down decimal ages', () => {
  expect(parseAge('25.9')).toBe(25)
})

test('handles zero', () => {
  expect(parseAge('0')).toBe(0)
})

test('handles the upper boundary', () => {
  expect(parseAge('150')).toBe(150)
})

test('throws for negative numbers', () => {
  expect(() => parseAge('-1')).toThrow('Invalid age: -1')
})

test('throws for numbers above 150', () => {
  expect(() => parseAge('151')).toThrow('Invalid age: 151')
})

test('throws for non-numeric strings', () => {
  expect(() => parseAge('abc')).toThrow('Invalid age: abc')
})

test('throws for empty string', () => {
  expect(() => parseAge('')).toThrow('Invalid age: ')
})
```

You don't need to test every possible input. Focus on the boundaries (0, 150, 151, -1), the error paths, and the types of inputs your function might realistically receive.

::: tip
If you're unsure whether an edge case matters, ask yourself: could a real user or a real caller trigger this? If yes, test it.
:::

### Property-Based Testing

For functions with a wide range of valid inputs, manually choosing edge cases can only go so far. **Property-based testing** is a technique where you describe the _properties_ that should hold for any input, and the testing framework generates hundreds of random inputs to try to find one that breaks.

For example, you might say "for any valid age string, `parseAge` should return a non-negative integer" and let the tool find the counterexample. [fast-check](https://fast-check.dev/) is a popular property-based testing library that integrates well with Vitest. It's an advanced technique, but worth knowing about as your testing needs grow.

## When to Mock

Mocking is a powerful tool, but it's easy to overuse.

### Slow Dependencies

Network requests, file system operations, and database calls can make your tests take seconds instead of milliseconds. Replace them with mocks to keep the feedback loop fast.

For HTTP requests specifically, consider using [Mock Service Worker](https://mswjs.io/) instead of mocking fetch directly. See the [Mocking Requests](/guide/mocking/requests) guide for setup instructions.

### Non-Deterministic Values

If your code depends on the current date, a random number, or a UUID generator, mock those to make your tests predictable. Vitest provides [`vi.useFakeTimers()`](/api/vi#vi-usefaketimers) and [`vi.setSystemTime()`](/api/vi#vi-setsystemtime) for controlling time in tests.

### What Not to Mock

Don't mock the thing you're testing. If you're testing a `UserService`, don't mock the `UserService`. Mock its _dependencies_ (the database, the email sender) and let the service itself run for real.

Also, prefer real implementations when they're fast and reliable. If a dependency is a simple in-memory data structure or a pure function, there's no reason to mock it. The closer your tests are to real usage, the more confidence they give you.

::: tip
Only reach for mocks when the real thing is slow, flaky, or has side effects you can't control in a test.
:::

## Fixing Bugs with Tests

When you find a bug, it's tempting to jump straight into the code and fix it. A better approach is to write a failing test first that reproduces the bug, then fix the code and watch the test turn green.

This has several benefits. The test proves the bug is real and not just a misunderstanding. It documents exactly what was broken. And it prevents the same bug from coming back later, because the test will catch it if someone accidentally reintroduces the same problem.

Here's what this looks like in practice. Suppose users report that `parseAge` crashes when given a string with leading spaces like `" 25"`. First, write a test that reproduces the problem:

```js
test('handles leading spaces', () => {
  expect(parseAge(' 25')).toBe(25)
})
```

Run it and confirm it fails. Now you know exactly what's broken and have a clear target. Fix the implementation:

```js
export function parseAge(input) {
  const age = Number(input.trim())
  // ...
}
```

Run the test again. It passes. The bug is fixed, and you have a regression test that will catch it if someone removes the `.trim()` call later.

::: tip
If you use AI agents to fix bugs, configure them to follow the same principle: reproduce the issue with a failing test first, then fix the code. This prevents the agent from "fixing" a bug by changing the test instead of the code, and gives you confidence that the fix actually works.
:::

## Organizing Test Files

There's no single right way to organize tests, but some patterns scale better than others.

### File Layout

The simplest starting point is one test file per source file. For every `utils.js`, there's a `utils.test.js` right next to it. This makes it easy to find the tests for any given piece of code, and most editors will show them side by side in the file tree:

```
src/
  utils.js
  utils.test.js
  formatPrice.js
  formatPrice.test.js
```

Some teams prefer a separate `__tests__` or `test` directory instead. Either approach works. The important thing is consistency across the project. Vitest's [`include`](/config/include) pattern matches both layouts by default.

### Grouping with `describe`

When a module exports multiple functions, use `describe` blocks to group the tests for each one. This keeps the test output organized and makes it clear which function a failing test belongs to:

```js
describe('formatPrice', () => {
  test('formats USD prices', () => { /* ... */ })
  test('handles zero', () => { /* ... */ })
})

describe('parseAmount', () => {
  test('parses valid amounts', () => { /* ... */ })
  test('throws for invalid input', () => { /* ... */ })
})
```

Avoid nesting `describe` blocks more than one or two levels deep. Deeply nested test trees are hard to read and usually mean the source module is doing too many things at once.

### Splitting Large Files

As a project grows, some test files will inevitably get long. If a test file grows beyond a few hundred lines, consider splitting it by theme or feature area. For example, `userService.test.js` might become `userService.creation.test.js` and `userService.auth.test.js`. This also makes it faster to run a subset of tests during development.

### Naming Tests

Test names matter more than you might expect. When a test fails in CI, the name is often the first thing someone reads. Names like "works correctly" or "handles edge case" don't tell you what broke.

Prefer names that describe the specific behavior: "returns 0 for an empty cart", "throws if the email format is invalid", "preserves existing items when adding a new one". The test output should read like a specification of what the module does.

## A Worked Example

Let's put it all together. Here's a small `TodoList` module:

```js [todoList.js]
let nextId = 1

export function createTodoList() {
  const items = []

  return {
    add(text) {
      if (!text.trim()) {
        throw new Error('Todo text cannot be empty')
      }
      const todo = { id: nextId++, text, completed: false }
      items.push(todo)
      return todo
    },

    remove(id) {
      const index = items.findIndex(item => item.id === id)
      if (index === -1) {
        throw new Error(`Todo with id ${id} not found`)
      }
      items.splice(index, 1)
    },

    toggle(id) {
      const todo = items.find(item => item.id === id)
      if (!todo) {
        throw new Error(`Todo with id ${id} not found`)
      }
      todo.completed = !todo.completed
    },

    getAll() {
      return items
    },

    getCompleted() {
      return items.filter(item => item.completed)
    },
  }
}
```

Looking at this code, we can identify the behaviors to test:

- Adding items (the main purpose)
- Adding empty items (should fail)
- Removing items by ID
- Removing items that don't exist (should fail)
- Toggling completion status
- Getting all items vs. completed items

Here's how the test file might look:

```js [todoList.test.js]
import { describe, expect, test } from 'vitest'
import { createTodoList } from './todoList.js'

describe('add', () => {
  test('adds a new todo', () => {
    const list = createTodoList()
    const todo = list.add('Buy groceries')

    expect(todo.text).toBe('Buy groceries')
    expect(todo.completed).toBe(false)
    expect(list.getAll()).toHaveLength(1)
  })

  test('assigns unique IDs to each todo', () => {
    const list = createTodoList()
    const first = list.add('First')
    const second = list.add('Second')

    expect(first.id).not.toBe(second.id)
  })

  test('throws when text is empty', () => {
    const list = createTodoList()
    expect(() => list.add('')).toThrow('Todo text cannot be empty')
  })

  test('throws when text is only whitespace', () => {
    const list = createTodoList()
    expect(() => list.add('   ')).toThrow('Todo text cannot be empty')
  })
})

describe('remove', () => {
  test('removes a todo by ID', () => {
    const list = createTodoList()
    const todo = list.add('Buy groceries')

    list.remove(todo.id)

    expect(list.getAll()).toHaveLength(0)
  })

  test('keeps other items when removing one', () => {
    const list = createTodoList()
    const first = list.add('First')
    list.add('Second')

    list.remove(first.id)

    expect(list.getAll()).toHaveLength(1)
    expect(list.getAll()[0].text).toBe('Second')
  })

  test('throws when ID does not exist', () => {
    const list = createTodoList()
    expect(() => list.remove(999)).toThrow('Todo with id 999 not found')
  })
})

describe('toggle', () => {
  test('marks a todo as completed', () => {
    const list = createTodoList()
    const todo = list.add('Buy groceries')

    list.toggle(todo.id)

    expect(list.getAll()[0].completed).toBe(true)
  })

  test('toggles back to incomplete', () => {
    const list = createTodoList()
    const todo = list.add('Buy groceries')

    list.toggle(todo.id)
    list.toggle(todo.id)

    expect(list.getAll()[0].completed).toBe(false)
  })

  test('throws when ID does not exist', () => {
    const list = createTodoList()
    expect(() => list.toggle(999)).toThrow('Todo with id 999 not found')
  })
})

describe('getCompleted', () => {
  test('returns only completed todos', () => {
    const list = createTodoList()
    const buy = list.add('Buy groceries')
    list.add('Clean house')
    list.toggle(buy.id)

    const completed = list.getCompleted()

    expect(completed).toHaveLength(1)
    expect(completed[0].text).toBe('Buy groceries')
  })

  test('returns empty array when nothing is completed', () => {
    const list = createTodoList()
    list.add('Buy groceries')

    expect(list.getCompleted()).toHaveLength(0)
  })
})
```

Each `describe` block focuses on one method. Each test verifies one specific behavior. The test names read like a specification of what the module does. And if any of these tests fail, the name and the assertion will tell you exactly what broke.

::: tip
Notice that we create a fresh `createTodoList()` in every test. This keeps tests independent, which means they can run in any order without affecting each other. If you find yourself repeating the same setup in every test, that's a good candidate for [`beforeEach`](/api/hooks#beforeeach) or a [`test.extend`](/guide/test-context#extend-test-context) fixture.
:::

::: details What about `nextId`?
The `nextId` counter at the top of the module is shared across all calls to `createTodoList()`, including across tests. This means IDs aren't predictable: one test might get IDs 1 and 2, while another gets 3 and 4 depending on execution order. This works fine here because the tests only check _relative_ uniqueness (`first.id !== second.id`), not specific ID values. If a test asserted `expect(todo.id).toBe(1)`, it would break depending on which tests ran before it. When you have shared module-level state like this, make sure your tests don't depend on its specific value.
:::

---

If you're building a web application and want to test components in a real browser environment, check out [Component Testing](/guide/browser/component-testing) for testing React, Vue, Svelte, and other UI frameworks.
