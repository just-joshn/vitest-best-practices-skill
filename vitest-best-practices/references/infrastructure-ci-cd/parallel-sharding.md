<!-- Verbatim excerpts from the official Vitest documentation, v5.1.1 (https://github.com/vitest-dev/vitest/tree/161e25f663a838f6a30890f8a6827ff83ff1b3c7/docs).
     Only this comment, the H1, the table of contents, and the "Source:" comments are generated. Every other line is copied from the docs.
     Root-relative links (e.g. /api/vi) resolve against https://vitest.dev. Do not edit. Regenerate with scripts/build.mjs. -->

# Parallelism & Sharding

## Table of Contents

1. Parallelism (guide/parallelism.md)
   - File Parallelism
   - Test Parallelism
2. Sharding (guide/improving-performance.md)
3. shard (guide/cli.md)
4. merge-reports (guide/cli.md)
5. Parallel and Sequential Test Files (guide/recipes/parallel-sequential.md)
   - Pattern
   - Run sequential after parallel
   - File scope vs. test scope
   - See also

<!-- Source: https://vitest.dev/guide/parallelism | docs/guide/parallelism.md -->

# Parallelism

Vitest has two levels of parallelism: it can run multiple _test files_ at the same time, and within each file it can run multiple _tests_ at the same time. Understanding the difference between the two is important because they work differently and have different trade-offs.

## File Parallelism

By default, Vitest runs test files in parallel across multiple workers. Each file gets its own isolated environment, so tests in different files can't interfere with each other. However, in [Browser Mode](/guide/browser/), browser storage such as cookies and `localStorage` can be shared between test files (see [`contextOptions`](/config/browser/playwright#contextoptions)).

The mechanism Vitest uses to create workers depends on the configured [`pool`](/config/pool):

- `forks` (the default) and `vmForks` run each file in a separate [child process](https://nodejs.org/api/child_process.html)
- `threads` and `vmThreads` run each file in a separate [worker thread](https://nodejs.org/api/worker_threads.html)

You can control how many workers run simultaneously with the [`maxWorkers`](/config/maxworkers) option. More workers means more files run in parallel, but also more memory and CPU usage. The right number depends on your machine and how heavy your tests are.

For most projects, file parallelism is the single biggest factor in test suite speed. However, there are cases where you might want to disable it — for example, if your tests share an external resource like a database that can't handle concurrent access. You can set [`fileParallelism`](/config/fileparallelism) to `false` to run files one at a time.

To learn more about tuning performance, see the [Performance Guide](/guide/improving-performance).

## Test Parallelism

Within a single file, Vitest runs tests sequentially by default. Tests execute in the order they are defined, one after another. This is the safest default because tests within a file often share setup and state through lifecycle hooks like `beforeEach`.

If the tests in a file are independent, you can opt into running them concurrently with the [`concurrent`](/api/test#test-concurrent) modifier:

```ts
import { expect, test } from 'vitest'

test.concurrent('fetches user profile', async () => {
  const user = await fetchUser(1)
  expect(user.name).toBe('Alice')
})

test.concurrent('fetches user posts', async () => {
  const posts = await fetchPosts(1)
  expect(posts).toHaveLength(3)
})
```

When tests are marked as `concurrent`, Vitest groups them together and runs them with [`Promise.all`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all). The number of tests running at once is bounded by the [`maxConcurrency`](/config/maxconcurrency) option.

::: tip When does `concurrent` actually help?
Vitest doesn't create extra workers for concurrent tests — they all run in the same worker as the file they belong to. This means `concurrent` only speeds things up when your tests spend time _waiting_ (on network requests, timers, file I/O, etc.). Purely synchronous tests won't benefit because they still block the single JavaScript thread:

```ts
// These run one after another despite `concurrent`,
// because there is nothing to await
test.concurrent('the first test', () => {
  expect(1).toBe(1)
})

test.concurrent('the second test', () => {
  expect(2).toBe(2)
})
```

:::

You can also apply `concurrent` to an entire suite:

```ts
import { describe, expect, test } from 'vitest'

describe.concurrent('user API', () => {
  test('fetches profile', async () => {
    const user = await fetchUser(1)
    expect(user.name).toBe('Alice')
  })

  test('fetches posts', async () => {
    const posts = await fetchPosts(1)
    expect(posts).toHaveLength(3)
  })
})
```

If you want _all_ tests in your project to run concurrently by default, set [`sequence.concurrent`](/config/sequence#sequence-concurrent) to `true` in your config.

You can opt individual tests or suites out of inherited concurrency with `concurrent: false`:

```ts
test('uses a shared resource', { concurrent: false }, async () => {
  // ...
})

describe('shared resource suite', { concurrent: false }, () => {
  test('step 1', async () => { /* ... */ })
  test('step 2', async () => { /* ... */ })
})
```

### Hooks with Concurrent Tests

When tests run concurrently, lifecycle hooks behave differently. `beforeAll` and `afterAll` still run once for the group, but `beforeEach` and `afterEach` run for each test — potentially at the same time, since the tests themselves overlap.

The hook execution order is controlled by [`sequence.hooks`](/config/sequence#sequence-hooks). With `sequence.hooks: 'parallel'`, hooks are also bounded by the [`maxConcurrency`](/config/maxconcurrency) limit.

<!-- Source: https://vitest.dev/guide/improving-performance | docs/guide/improving-performance.md | section: ## Sharding -->

## Sharding

Test sharding is a process of splitting your test suite into groups, or shards. This can be useful when you have a large test suite and multiple machines that could run subsets of that suite simultaneously.

To split Vitest tests on multiple different runs, use [`--shard`](/guide/cli#shard) option with [`--reporter=blob`](/guide/reporters#blob-reporter) option:

```sh
vitest run --reporter=blob --shard=1/3 # 1st machine
vitest run --reporter=blob --shard=2/3 # 2nd machine
vitest run --reporter=blob --shard=3/3 # 3rd machine
```

> Vitest splits your _test files_, not your test cases, into shards. If you've got 1000 test files, the `--shard=1/4` option will run 250 test files, no matter how many test cases individual files have.

Collect the results stored in `.vitest/blob/` directory from each machine and merge them with [`--merge-reports`](/guide/cli#merge-reports) option:

```sh
vitest run --merge-reports
```

When running the same shards across multiple environments, set the `VITEST_BLOB_LABEL` environment variable so merged reports can display them separately:

```sh
VITEST_BLOB_LABEL=linux vitest run --reporter=blob --shard=1/3
```

::: details GitHub Actions example
This setup is also used at https://github.com/vitest-tests/test-sharding.

```yaml
# Inspired from https://playwright.dev/docs/test-sharding
name: Tests
on:
  push:
    branches:
      - main
jobs:
  tests:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest]
        shardIndex: [1, 2, 3, 4]
        shardTotal: [4]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24

      - name: Install pnpm
        uses: pnpm/action-setup@a7487c7e89a18df4991f7f222e4898a00d66ddda # v4.1.0

      - name: Install dependencies
        run: pnpm i

      - name: Run tests
        run: pnpm run test --reporter=blob --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
        env:
          VITEST_BLOB_LABEL: ${{ matrix.os }}

      - name: Upload Vitest results GitHub Actions Artifacts
        if: ${{ !cancelled() }}
        uses: actions/upload-artifact@v4
        with:
          name: vitest-results-${{ matrix.os }}-${{ matrix.shardIndex }}
          path: .vitest
          include-hidden-files: true
          retention-days: 1

  merge-reports:
    if: ${{ !cancelled() }}
    needs: [tests]

    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24

      - name: Install pnpm
        uses: pnpm/action-setup@a7487c7e89a18df4991f7f222e4898a00d66ddda # v4.1.0

      - name: Install dependencies
        run: pnpm i

      - name: Download Vitest results from GitHub Actions Artifacts
        uses: actions/download-artifact@v4
        with:
          path: .vitest
          merge-multiple: true

      - name: Merge reports
        run: npx vitest --merge-reports
```

If your tests create file-based attachments (for example via `context.annotate` or custom artifacts), upload and restore [`attachmentsDir`](/config/attachmentsdir) in the merge job as shown above.

:::

:::tip
Test sharding can also become useful on high CPU-count machines.

Vitest will run only a single Vite server in its main thread. Rest of the threads are used to run test files.
In a high CPU-count machine the main thread can become a bottleneck as it cannot handle all the requests coming from the threads. For example in 32 CPU machine the main thread is responsible to handle load coming from 31 test threads.

To reduce the load from main thread's Vite server you can use test sharding. The load can be balanced on multiple Vite server.

```sh
# Example for splitting tests on 32 CPU to 4 shards.
# As each process needs 1 main thread, there's 7 threads for test runners (1+7)*4 = 32
# Use VITEST_MAX_WORKERS:
VITEST_MAX_WORKERS=7 vitest run --reporter=blob --shard=1/4 & \
VITEST_MAX_WORKERS=7 vitest run --reporter=blob --shard=2/4 & \
VITEST_MAX_WORKERS=7 vitest run --reporter=blob --shard=3/4 & \
VITEST_MAX_WORKERS=7 vitest run --reporter=blob --shard=4/4 & \
wait # https://man7.org/linux/man-pages/man2/waitpid.2.html

vitest run --merge-reports
```

:::

<!-- Source: https://vitest.dev/guide/cli | docs/guide/cli.md | section: ### shard -->

### shard

- **Type:** `string`
- **Default:** disabled

Test suite shard to execute in a format of `<index>`/`<count>`, where

- `count` is a positive integer, count of divided parts
- `index` is a positive integer, index of divided part

This command will divide all tests into `count` equal parts, and will run only those that happen to be in an `index` part. For example, to split your tests suite into three parts, use this:

```sh
vitest run --shard=1/3
vitest run --shard=2/3
vitest run --shard=3/3
```

:::warning
You cannot use this option with `--watch` enabled (enabled in dev by default).
:::

::: tip
If `--reporter=blob` is used without an output file, the default path will include the current shard config and blob label from `VITEST_BLOB_LABEL` or the blob reporter `label` option to avoid collisions with other Vitest processes.
:::

<!-- Source: https://vitest.dev/guide/cli | docs/guide/cli.md | section: ### merge-reports -->

### merge-reports

- **Type:** `boolean | string`

Merges every blob report located in the specified folder (`.vitest/blob/` by default). You can use any reporters with this command (except [`blob`](/guide/reporters#blob-reporter)):

```sh
vitest --merge-reports --reporter=junit
```

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
