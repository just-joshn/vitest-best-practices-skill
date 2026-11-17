<!-- Verbatim excerpts from the official Vitest documentation, v5.1.1 (https://github.com/vitest-dev/vitest/tree/161e25f663a838f6a30890f8a6827ff83ff1b3c7/docs).
     Only this comment, the H1, the table of contents, and the "Source:" comments are generated. Every other line is copied from the docs.
     Root-relative links (e.g. /api/vi) resolve against https://vitest.dev. Do not edit. Regenerate with scripts/build.mjs. -->

# Flaky Tests

## Table of Contents

1. retry (config/retry.md)
   - Basic Usage
   - CLI Usage
   - Advanced Options
   - Test File Override
2. repeats (config/repeats.md)
3. retry (api/test.md)
4. repeats (api/test.md)
5. Repeating Setup for Each Test (guide/learn/setup-teardown.md)
6. Skipping Tests with `.skip` (guide/filtering.md)
7. Parallel and Sequential Test Files (guide/recipes/parallel-sequential.md)
   - Pattern
   - Run sequential after parallel
   - File scope vs. test scope
   - See also
8. Disable animations (guide/browser/visual-regression-testing.md)
9. Flaky tests or different screenshot sizes (guide/browser/visual-regression-testing.md)

<!-- Source: https://vitest.dev/config/retry | docs/config/retry.md -->

# retry

Retry the test specific number of times if it fails.

- **Type:** `number | { count?: number, delay?: number, condition?: RegExp }`
- **Default:** `0`
- **CLI:** `--retry <times>`, `--retry.count <times>`, `--retry.delay <ms>`, `--retry.condition <pattern>`

## Basic Usage

Specify a number to retry failed tests:

```ts
export default defineConfig({
  test: {
    retry: 3,
  },
})
```

## CLI Usage

You can also configure retry options from the command line:

```bash
# Simple retry count
vitest --retry 3

# Advanced options using dot notation
vitest --retry.count 3 --retry.delay 500 --retry.condition 'ECONNREFUSED|timeout'
```

## Advanced Options <Version>4.1.0</Version> {#advanced-options}

Use an object to configure retry behavior:

```ts
export default defineConfig({
  test: {
    retry: {
      count: 3, // Number of times to retry
      delay: 1000, // Delay in milliseconds between retries
      condition: /ECONNREFUSED|timeout/i, // RegExp to match errors that should trigger retry
    },
  },
})
```

### count

Number of times to retry a test if it fails. Default is `0`.

```ts
export default defineConfig({
  test: {
    retry: {
      count: 2,
    },
  },
})
```

### delay

Delay in milliseconds between retry attempts. Useful for tests that interact with rate-limited APIs or need time to recover. Default is `0`.

```ts
export default defineConfig({
  test: {
    retry: {
      count: 3,
      delay: 500, // Wait 500ms between retries
    },
  },
})
```

### condition

A RegExp pattern or a function to determine if a test should be retried based on the error.

- When a **RegExp**, it's tested against the error message
- When a **function**, it receives the error and returns a boolean

::: warning
When defining `condition` as a function, it must be done in a test file directly, not in a configuration file (configurations are serialized for worker threads).
:::

#### RegExp condition (in config file):

```ts
export default defineConfig({
  test: {
    retry: {
      count: 2,
      condition: /ECONNREFUSED|ETIMEDOUT/i, // Retry on connection/timeout errors
    },
  },
})
```

#### Function condition (in test file):

```ts
import { describe, test } from 'vitest'

describe('tests with advanced retry condition', () => {
  test('with function condition', { retry: { count: 2, condition: error => error.message.includes('Network') } }, () => {
    // test code
  })
})
```

## Test File Override

You can also define retry options per test or suite in test files:

```ts
import { describe, test } from 'vitest'

describe('flaky tests', {
  retry: {
    count: 2,
    delay: 100,
  },
}, () => {
  test('network request', () => {
    // test code
  })
})

test('another test', {
  retry: {
    count: 3,
    condition: error => error.message.includes('timeout'),
  },
}, () => {
  // test code
})
```

<!-- Source: https://vitest.dev/config/repeats | docs/config/repeats.md -->

# repeats

- **Type:** `number`
- **Default:** `0`
- **CLI:** `--repeats=<number>`

Repeat every test a specific number of times regardless of the result. A test that uses the [`repeats`](/api/test#repeats) test option takes precedence over this value.

This is useful for verifying that tests are stable across multiple runs. If a test fails on any repetition, the whole test is reported as failed.

<!-- Source: https://vitest.dev/api/test | docs/api/test.md | section: ### retry -->

### retry

- **Default:** `0` (configured by [`retry`](/config/retry))
- **Type:**

```ts
type Retry = number | {
  /**
   * The number of times to retry the test if it fails.
   * @default 0
   */
  count?: number
  /**
   * Delay in milliseconds between retry attempts.
   * @default 0
   */
  delay?: number
  /**
   * Condition to determine if a test should be retried based on the error.
   * - If a RegExp, it is tested against the error message
   * - If a function, called with the TestError object; return true to retry
   *
   * NOTE: Functions can only be used in test files, not in vitest.config.ts,
   * because the configuration is serialized when passed to worker threads.
   *
   * @default undefined (retry on all errors)
   */
  condition?: RegExp | ((error: TestError) => boolean)
}
```

Retry configuration for the test. If a number, specifies how many times to retry. If an object, allows fine-grained retry control.

Note that the object configuration is available only since Vitest 4.1.

<!-- Source: https://vitest.dev/api/test | docs/api/test.md | section: ### repeats -->

### repeats

- **Type:** `number`
- **Default:** `0`

How many times the test will run again. If set to `0` (the default), the test will run only one time.

This can be useful for debugging flaky tests.

<!-- Source: https://vitest.dev/guide/learn/setup-teardown | docs/guide/learn/setup-teardown.md | section: ## Repeating Setup for Each Test -->

## Repeating Setup for Each Test

The most common hooks are [`beforeEach`](/api/hooks#beforeeach) and [`afterEach`](/api/hooks#aftereach). As the names suggest, `beforeEach` runs before every test in the file, and `afterEach` runs after every test, even if the test fails. This makes them perfect for ensuring each test starts with a known state.

```js
import { afterEach, beforeEach, expect, test } from 'vitest'

let items

beforeEach(() => {
  items = ['apple', 'banana', 'cherry']
})

afterEach(() => {
  items = []
})

test('items starts with 3 fruits', () => {
  expect(items).toHaveLength(3)
})

test('can remove an item', () => {
  items.pop()
  expect(items).toHaveLength(2)
})

test('can add an item', () => {
  items.push('date')
  expect(items).toHaveLength(4)
  // beforeEach reset the array to 3 items before this test ran,
  // proving that mutations from the previous test do not leak.
})
```

Without these hooks, mutations like `pop` or `push` from earlier tests would affect subsequent ones, which is a classic source of flaky tests, while the hooks guarantee clean state for every test.

<!-- Source: https://vitest.dev/guide/filtering | docs/guide/filtering.md | section: ## Skipping Tests with `.skip` -->

## Skipping Tests with `.skip`

The opposite of `.only` is `.skip`. Use it to temporarily disable a test or suite without deleting it. Skipped tests still show up in the report so you don't forget about them:

```ts
import { describe, expect, it } from 'vitest'

describe.skip('skipped suite', () => {
  it('test', () => {
    // This entire suite is skipped
    expect(Math.sqrt(4)).toBe(2)
  })
})

describe('suite', () => {
  it.skip('skipped test', () => {
    // Just this one test is skipped
    expect(Math.sqrt(4)).toBe(2)
  })
})
```

This is useful when a test is flaky or depends on an external service that's temporarily down. It lets you keep the test in place as a reminder while unblocking the rest of the suite.

<!-- Source: https://vitest.dev/guide/recipes/parallel-sequential | docs/guide/recipes/parallel-sequential.md -->

# Parallel and Sequential Test Files

Most test files are independent and run faster in parallel. The exception is the handful that share an exclusive resource, like a fixed port, a writable temp directory, or a database without per-test isolation. Those files flake when other tests run concurrently with them.

Disabling parallelism globally would slow down every test in the suite. Splitting the suite into two [`projects`](/guide/projects), one parallel and one sequential, lets only the affected files pay the cost.

## Pattern

```ts [vitest.config.ts]
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'Parallel',
          exclude: ['**.sequential.test.ts'],
        },
      },
      {
        test: {
          name: 'Sequential',
          include: ['**.sequential.test.ts'],
          fileParallelism: false,
        },
      },
    ],
  },
})
```

[`fileParallelism: false`](/config/fileparallelism) at the project level keeps the rest of your suite running concurrently while the matched files run one at a time. It's a shorthand for [`maxWorkers: 1`](/config/maxworkers); the two settings are equivalent.

## Run sequential after parallel

By default, projects run in parallel with each other, so the sequential project's first file may overlap with parallel files that still hold the same resource. Use [`sequence.groupOrder`](/config/sequence#sequence-grouporder) <Version>3.2.0</Version> to force the parallel batch to finish first:

```ts [vitest.config.ts]
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'Parallel',
          exclude: ['**.sequential.test.ts'],
          sequence: { groupOrder: 0 },
        },
      },
      {
        test: {
          name: 'Sequential',
          include: ['**.sequential.test.ts'],
          fileParallelism: false,
          sequence: { groupOrder: 1 },
        },
      },
    ],
  },
})
```

The parallel batch finishes, _then_ the sequential batch starts. Total wall clock stays close to the parallel time plus sum of the sequential test run time.

## File scope vs. test scope

There are two different "parallel" knobs in Vitest. Don't confuse them:

| Scope         | Knob                                         | Controls                                         |
| ------------- | -------------------------------------------- | ------------------------------------------------ |
| Across files  | [`fileParallelism`](/config/fileparallelism) | Whether two test _files_ run in parallel workers |
| Within a file | `describe.concurrent` / `test.concurrent`    | Whether tests _inside one file_ run concurrently |

`fileParallelism: false` doesn't make tests inside a file concurrent; tests inside a file are sequential by default. And `concurrent` on a `describe` or `test` doesn't affect how files are scheduled.

## See also

- [`fileParallelism`](/config/fileparallelism)
- [`maxWorkers`](/config/maxworkers)
- [`sequence.groupOrder`](/config/sequence#sequence-grouporder)
- [Parallelism](/guide/parallelism)
- [Test Projects](/guide/projects)
- [Per-File Isolation Settings](/guide/recipes/disable-isolation)

<!-- Source: https://vitest.dev/guide/browser/visual-regression-testing | docs/guide/browser/visual-regression-testing.md | section: ### Disable animations -->

### Disable animations

::: tip
When using the Playwright provider, animations are automatically disabled when using the built-in assertion: the `animations` option's value in `screenshotOptions` is set to `"disabled"` by default.

If you prefer to disable all animations to save some execution time, continue reading.
:::

Animations can cause flaky tests. Disable them during testing by injecting a custom CSS snippet using [`setupFiles`](/config/setupfiles) or directly in your tests:

```ts
const stylesheet = document.createElement('style')

stylesheet.textContent = /* css */`
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
  }
`

document.head.appendChild(stylesheet)
```

Alternatively, you can declare the CSS in a custom HTML template by using [`browser.testerHtmlPath`](/config/browser/testerhtmlpath).

<!-- Source: https://vitest.dev/guide/browser/visual-regression-testing | docs/guide/browser/visual-regression-testing.md | section: ### Flaky tests or different screenshot sizes -->

### Flaky tests or different screenshot sizes

If tests pass and fail randomly, or if screenshots have different dimensions between runs:

- Wait for everything to load, including loading indicators
- Set explicit viewport sizes: `await page.viewport(1920, 1080)`
- Check for responsive behavior at viewport boundaries
- Check for unintended animations or transitions
- Increase test timeout for large screenshots
- [Consider a shared environment setup](#visual-testing-for-teams)
