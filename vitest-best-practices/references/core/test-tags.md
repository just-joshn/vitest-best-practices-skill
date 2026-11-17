<!-- Verbatim excerpts from the official Vitest documentation, v5.1.1 (https://github.com/vitest-dev/vitest/tree/161e25f663a838f6a30890f8a6827ff83ff1b3c7/docs).
     Only this comment, the H1, the table of contents, and the "Source:" comments are generated. Every other line is copied from the docs.
     Root-relative links (e.g. /api/vi) resolve against https://vitest.dev. Do not edit. Regenerate with scripts/build.mjs. -->

# Test Tags & Filtering

## Table of Contents

1. Test Tags (guide/test-tags.md)
   - Why tags
   - When to reach for tags
   - Defining Tags
   - Using Tags in Tests
   - Filtering Tests by Tag
   - See also
2. Test Filtering (guide/filtering.md)
   - Filtering by File Name
   - Filtering by Test Name
   - Filtering by Line Number
   - Filtering by Tags
   - Focusing on Specific Tests with `.only`
   - Skipping Tests with `.skip`
   - Placeholder Tests with `.todo`

<!-- Source: https://vitest.dev/guide/test-tags | docs/guide/test-tags.md -->

# Test Tags <Version>4.1.0</Version> {#test-tags}

[`Tags`](/config/tags) let you label tests so you can filter what runs and override their options when needed.

## Why tags

Tags become useful once a suite has groups of tests that share runner options, like a longer timeout for database queries or retries for integration tests on CI. Repeating those options on every relevant test by hand is brittle, and the categories often don't line up with file paths anyway, so splitting them out by file isn't an option. Flaky tests in particular tend to accumulate wherever the bugs landed, not in a `flaky/` folder.

A tag captures that kind of category: the definition holds the shared options, and any test marked with the tag inherits them. Those tag names can also be combined into expressions: `--tags-filter='db && !flaky'` runs database tests that aren't marked flaky. [`TestRunner.matchesTags`](#checking-tags-filter-at-runtime) exposes the same expression at runtime, useful when `globalSetup` does expensive work that should be skipped if no tagged tests are scheduled.

## When to reach for tags

| If you want to…                                                                         | Use                                                          |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Apply timeout/retry to a _category_ of tests                                            | **Tags**                                                     |
| Mark cross-cutting categories (`flaky`, `slow`, `frontend`) scattered across many files | **Tags**                                                     |
| Conditionally run expensive setup based on what's filtered                              | **Tags** + [`matchesTags`](#checking-tags-filter-at-runtime) |
| Run a subset by test name match                                                         | [`-t` / `testNamePattern`](/config/testnamepattern)          |
| Run a subset by file path                                                               | `--include` / `--exclude`                                    |
| Run different files with different _runner settings_ (isolation, pool, environment)     | [Test Projects](/guide/projects)                             |

You can combine projects and tags. A test that sits in a `Sequential` project can also carry a `flaky` tag, and Vitest applies both.

## Defining Tags

Tags must be defined in your configuration file. By default, Vitest does not provide any built-in tags. If a test uses a tag that isn't defined in the config, the test runner will throw an error. This prevents unexpected behavior from mistyped tag names. You can disable this check with the [`strictTags`](/config/stricttags) option.

You must define a `name` of the tag, and you may define additional options that will be applied to every test marked with the tag, e.g., a `timeout`, or `retry`. For the full list of available options, see [`tags`](/config/tags).

```ts [vitest.config.js]
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    tags: [
      {
        name: 'frontend',
        description: 'Tests written for frontend.',
      },
      {
        name: 'backend',
        description: 'Tests written for backend.',
      },
      {
        name: 'db',
        description: 'Tests for database queries.',
        timeout: 60_000,
      },
      {
        name: 'flaky',
        description: 'Flaky CI tests.',
        retry: process.env.CI ? 3 : 0,
        timeout: 30_000,
        priority: 1,
      },
    ],
  },
})
```

If you are using TypeScript, you can enforce what tags are available by augmenting the `TestTags` type with a property that contains a union of strings (make sure this file is included by your `tsconfig`):

```ts [vitest.shims.ts]
import 'vitest'

declare module 'vitest' {
  interface TestTags {
    tags:
      | 'frontend'
      | 'backend'
      | 'db'
      | 'flaky'
  }
}
```

To see all your tags, you can use [`--list-tags`](/guide/cli#listtags) command:

```shell
vitest --list-tags

frontend: Tests written for frontend.
backend: Tests written for backend.
db: Tests for database queries.
flaky: Flaky CI tests.
```

To print it in JSON, pass down `--list-tags=json`:

```json
{
  "tags": [
    {
      "name": "frontend",
      "description": "Tests written for frontend."
    },
    {
      "name": "backend",
      "description": "Tests written for backend."
    },
    {
      "name": "db",
      "description": "Tests for database queries.",
      "timeout": 60000
    },
    {
      "name": "flaky",
      "description": "Flaky CI tests.",
      "retry": 0,
      "timeout": 30000,
      "priority": 1
    }
  ],
  "projects": []
}
```

### Resolving option conflicts

If several tags define the same option and are applied to the same test, they are resolved by `priority` first (lower number wins), then by the order they appear in the test's `tags` array. Tags without a `priority` are merged first and overridden by higher-priority ones:

```ts
test('flaky database test', { tags: ['flaky', 'db'] })
// { timeout: 30_000, retry: 3 }
```

The `timeout` is 30 seconds (not 60) because `flaky` has priority `1` while `db` has no priority.

Options defined on the test itself always win:

```ts
test('flaky database test', { tags: ['flaky', 'db'], timeout: 120_000 })
// { timeout: 120_000, retry: 3 }
```

Options set to `undefined` are ignored, so they don't override the values from tags:

```ts
test('flaky database test', { tags: ['flaky', 'db'], timeout: undefined })
// { timeout: 30_000, retry: 3 }
```

## Using Tags in Tests

You can apply tags to individual tests or entire suites using the `tags` option:

```ts
import { describe, test } from 'vitest'

test('renders homepage', { tags: ['frontend'] }, () => {
  // ...
})

describe('API endpoints', { tags: ['backend'] }, () => {
  test('returns user data', () => {
    // This test inherits the "backend" tag from the parent suite
  })

  test('validates input', { tags: ['validation'] }, () => {
    // This test has both "backend" (inherited) and "validation" tags
  })
})
```

Tags are inherited from parent suites, so all tests inside a tagged `describe` block will automatically have that tag.

It's also possible to define `tags` for every test in the file by using JSDoc's `@module-tag` at the top of the file:

```ts
/**
 * Auth tests
 * @module-tag admin/pages/dashboard
 * @module-tag acceptance
 */

test('dashboard renders items', () => {
  // ...
})
```

::: danger
A `@module-tag` in a JSDoc comment applies to all tests in that file, not just the test it precedes.

Consider this example:

```js{3,10}
describe('forms', () => {
  /**
   * @module-tag frontend
   */
  test('renders a form', () => {
    // ...
  })

  /**
   * @module-tag db
   */
  test('db returns users', () => {
    // ...
  })
})
```

In this example, every test in the file will have both the `frontend` and `db` tags. To tag individual tests, use the options argument instead:

```js{2,6}
describe('forms', () => {
  test('renders a form', { tags: 'frontend' }, () => {
    // ...
  })

  test('db returns users', { tags: 'db' }, () => {
    // ...
  })
})
```

:::

## Filtering Tests by Tag

To run only tests with specific tags, use the [`--tags-filter`](/guide/cli#tagsfilter) CLI option:

```shell
vitest --tags-filter=frontend
vitest --tags-filter="frontend and backend"
```

If you are running Vitest UI, you can start a filter with a `tag:` prefix to filter out tests by tags using the same tags expression syntax:

<img alt="The tags filter in Vitest UI" img-light src="/ui/light-ui-tags.png">
<img alt="The tags filter in Vitest UI" img-dark src="/ui/dark-ui-tags.png">

If you are using a programmatic API, you can pass down a `tagsFilter` option to [`startVitest`](/guide/advanced/#startvitest) or [`createVitest`](/guide/advanced/#createvitest):

```ts
import { startVitest } from 'vitest/node'

await startVitest([], {
  tagsFilter: ['frontend and backend'],
})
```

Or you can create a [test specification](/api/advanced/test-specification) with your custom filters:

```ts
const specification = vitest.getRootProject().createSpecification(
  '/path-to-file.js',
  {
    testTagsFilter: ['frontend and backend'],
  },
)
```

### Syntax

You can combine tags in different ways. Vitest supports these keywords:

- `and` or `&&` to include both expressions
- `or` or `||` to include at least one expression
- `not` or `!` to exclude the expression
- `*` to match any number of characters (0 or more)
- `()` to group expressions and override precedence

The parser follows standard [operator precedence](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_precedence): `not`/`!` has the highest priority, then `and`/`&&`, then `or`/`||`. Use parentheses to override default precedence.

::: warning Reserved Names
Tag names cannot be `and`, `or`, or `not` (case-insensitive) as these are reserved keywords. Tag names also cannot contain special characters (`(`, `)`, `&`, `|`, `!`, `*`, spaces) as these are used by the expression parser.
:::

### Wildcards

You can use a wildcard (`*`) to match any number of characters:

```shell
vitest --tags-filter="unit/*"
```

This will match tags like `unit/components`, `unit/utils`, etc.

### Excluding Tags

To exclude tests with a specific tag, add an exclamation mark (`!`) at the start or a "not" keyword:

```shell
vitest --tags-filter="!slow and not flaky"
```

### Examples

Here are some common filtering patterns:

```shell
# Run only unit tests
vitest --tags-filter="unit"

# Run tests that are both frontend AND fast
vitest --tags-filter="frontend and fast"

# Run tests that are either unit OR e2e
vitest --tags-filter="unit or e2e"

# Run all tests except slow ones
vitest --tags-filter="!slow"

# Run frontend tests that are not flaky
vitest --tags-filter="frontend && !flaky"

# Run tests matching a wildcard pattern
vitest --tags-filter="api/*"

# Complex expression with parentheses
vitest --tags-filter="(unit || e2e) && !slow"

# Run database tests that are either postgres or mysql, but not slow
vitest --tags-filter="db && (postgres || mysql) && !slow"
```

You can also pass multiple `--tags-filter` flags. They are combined with AND logic:

```shell
# Run tests that match (unit OR e2e) AND are NOT slow
vitest --tags-filter="unit || e2e" --tags-filter="!slow"
```

### Checking Tags Filter at Runtime

You can use `TestRunner.matchesTags` to check whether the current tags filter matches a set of tags. This is useful for conditionally running expensive setup logic only when relevant tests are included:

```ts
import { beforeAll, TestRunner } from 'vitest'

beforeAll(async () => {
  // Seed database when "vitest --tags-filter db" is used
  if (TestRunner.matchesTags(['db'])) {
    await seedDatabase()
  }
})
```

The method accepts an array of tags and returns `true` if the current `--tags-filter` would include a test with those tags. If no tags filter is active, it always returns `true`.

## See also

- [Per-File Isolation Settings](/guide/recipes/disable-isolation) and [Parallel and Sequential Test Files](/guide/recipes/parallel-sequential) use projects to partition tests by file. Reach for projects when categories need different runner settings rather than different timeouts or retries.
- [Test Filtering](/guide/filtering) covers `-t`, `--include`, and the rest of the CLI filters.
- [`tags`](/config/tags) and [`strictTags`](/config/stricttags) configuration reference.

<!-- Source: https://vitest.dev/guide/filtering | docs/guide/filtering.md -->

# Test Filtering

As your test suite grows, running every test on every change becomes slow and distracting. If you're fixing a bug in a single module, you don't need to wait for hundreds of unrelated tests to finish. Test filtering lets you narrow down which tests run so you can stay focused on the code you're actively working on.

Vitest offers several ways to filter tests: from the command line, inside your test files, and through tags. Each approach is useful in different situations.

::: tip Performance Note
Filters like `-t`, `--tags-filter`, `.only`, and `.skip` are applied _per test file_ — Vitest still has to run each test file to discover which tests match. In a large project, this overhead adds up even if only a few tests actually execute.

To avoid this, always pass a file path alongside your filter so Vitest only loads the files you care about:

```bash
vitest utils.test.ts -t "handles empty input"
```

Alternatively, you can use the [`--experimental.preParse`](/config/experimental#experimental-preparse) flag, which parses test files to discover test names without fully executing them:

```bash
vitest --experimental.preParse -t "handles empty input"
```

:::

## Filtering by File Name

The simplest way to run a subset of tests is to pass a filename pattern as a CLI argument. Vitest will only run test files whose path contains the given string:

```bash
vitest basic
```

This matches any test file with `basic` in its path:

```
basic.test.ts
basic-foo.test.ts
basic/foo.test.ts
```

This is useful when you know which file you need to work on and want to skip everything else.

## Filtering by Test Name

Sometimes the test you care about is buried in a file with many other tests. The `-t` (or `--testNamePattern`) option filters by the test's name rather than the filename. It accepts a regex pattern and matches against the full test name, which is the enclosing `describe` block names and the test name joined with `' > '` (for example `math > adds`):

```bash
vitest -t "handles empty input"
```

You can combine this with a file filter to narrow things down further:

```bash
vitest utils -t "handles empty input"
```

This runs only tests whose name matches `"handles empty input"` inside files matching `utils`.

## Filtering by Line Number

When you're looking at a specific test in your editor, you often just want to run _that one test_. You can point directly to a line number:

```bash
vitest basic/foo.test.ts:10
```

Vitest will run the test that contains line 10. This requires the full filename (relative or absolute):

```bash
vitest basic/foo.test.ts:10 # ✅
vitest ./basic/foo.test.ts:10 # ✅
vitest /users/project/basic/foo.test.ts:10 # ✅
vitest foo:10 # ❌ partial name won't work
vitest ./basic/foo:10 # ❌ missing file extension
```

To run multiple specific tests, separate them with spaces:

```bash
vitest basic/foo.test.ts:10 basic/foo.test.ts:25 # ✅
vitest basic/foo.test.ts:10-25 # ❌ ranges are not supported
```

## Filtering by Tags

For larger projects, you may want to categorize tests and run them by category. [Tags](/guide/test-tags) let you label tests and then filter by those labels from the CLI:

```ts
test('renders a form', { tags: ['frontend'] }, () => {
  // ...
})

test('calls an external API', { tags: ['backend'] }, () => {
  // ...
})
```

```bash
vitest --tags-filter=frontend
```

This is particularly helpful in CI pipelines where you might want to run frontend and backend tests in separate jobs, or skip slow integration tests during quick checks.

## Focusing on Specific Tests with `.only`

When you're debugging a failing test, you want to run just that test without modifying CLI arguments every time. Adding `.only` to a test or suite tells Vitest to skip everything else in the file:

```ts
import { describe, expect, it } from 'vitest'

describe.only('suite', () => {
  it('test', () => {
    // This runs because the suite is marked with .only
    expect(Math.sqrt(4)).toBe(2)
  })
})

describe('another suite', () => {
  it('skipped test', () => {
    // This does not run
    expect(Math.sqrt(4)).toBe(2)
  })

  it.only('focused test', () => {
    // This also runs because it is marked with .only
    expect(Math.sqrt(4)).toBe(2)
  })
})
```

You can use `.only` on both `describe` blocks and individual tests. When any test or suite in a file is marked with `.only`, all unmarked tests in that file are skipped.

::: warning
Remember to remove `.only` before committing. By default, Vitest will fail the entire test run if it encounters `.only` in CI (when `process.env.CI` is set), preventing you from accidentally skipping tests in your pipeline. This behavior is controlled by the [`allowOnly`](/config/allowonly) option.

To catch `.only` even earlier, the [`no-focused-tests`](https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/no-focused-tests.md) ESLint rule (also available in [oxlint](https://oxc.rs/docs/guide/usage/linter/rules/jest/no-focused-tests.html)) can flag it in your editor before you commit.
:::

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

## Placeholder Tests with `.todo`

When planning new features, you might know what tests you'll need before you write the actual implementation. `.todo` marks a test as planned but not yet written. It shows up in the report as a reminder:

```ts
import { describe, it } from 'vitest'

describe.todo('unimplemented suite')

describe('suite', () => {
  it.todo('unimplemented test')
})
```

Unlike `.skip`, a `.todo` test has no test body. It's purely a placeholder for future work.
