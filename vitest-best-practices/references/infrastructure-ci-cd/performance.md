<!-- Verbatim excerpts from the official Vitest documentation, v5.1.1 (https://github.com/vitest-dev/vitest/tree/161e25f663a838f6a30890f8a6827ff83ff1b3c7/docs).
     Only this comment, the H1, the table of contents, and the "Source:" comments are generated. Every other line is copied from the docs.
     Root-relative links (e.g. /api/vi) resolve against https://vitest.dev. Do not edit. Regenerate with scripts/build.mjs. -->

# Performance

## Table of Contents

1. Improving Performance (guide/improving-performance.md)
   - Profile First
   - Test Isolation
   - Test Environments
   - Limiting Directory Search
   - Caching Between Reruns
   - Node Compile Cache
   - Pool
   - Sharding
2. Profiling Test Performance (guide/profiling-test-performance.md)
   - Test Runner
   - Main Thread
   - File Transform
   - File Import
   - Code Coverage
   - Inspecting Profiling Records
3. Per-File Isolation Settings (guide/recipes/disable-isolation.md)
   - Pattern
   - When isolation matters
   - Verifying it's safe
   - Per-pool isolation
   - See also
4. Open Telemetry Support (guide/open-telemetry.md)
   - Quickstart
   - Custom Traces
   - Browser Mode
   - View Traces
   - `@opentelemetry/api`
   - Inter-Process Context Propagation

<!-- Source: https://vitest.dev/guide/improving-performance | docs/guide/improving-performance.md -->

# Improving Performance

## Profile First

The `Duration` line of the summary breaks the run down into phases, as percentages of all tracked time:

```
Duration  3.76s (environment 79%, import 13%, transform 6%, tests 1%, setup 1%)
```

The percentages are relative to the sum of all tracked phases, not to the wall-clock time: phases run in parallel workers, so their sum is usually larger than the run itself. In a multi-project setup the percentages aggregate over all [projects](/guide/projects), so a phase that dominates one project can be diluted by the others; the performance hints below analyze each project separately.

The phases map to configuration options:

- `environment` - creating the test environment (for example `jsdom`, `happy-dom`) for test files. See [Test Environments](#test-environments).
- `transform` - waiting for Vite to resolve and transform imported modules. See [Caching Between Reruns](#caching-between-reruns).
- `import` - evaluating test files and their modules, excluding the transform wait tracked above. When files import mostly the same modules (typical for barrel-file imports), isolation re-evaluates that shared graph for every file. See [Test Isolation](#test-isolation).
- `setup` - running [`setupFiles`](/config/setupfiles).
- `worker` - preparing the test runner in each worker. Isolation pays this cost for every test file. See [Test Isolation](#test-isolation).
- `tests` - running the tests themselves. A run dominated by this phase has little to gain from configuration changes.

When the collected timings show that a configuration change would make the run significantly faster, Vitest also prints a hint after the summary, see [`experimental.diagnostics`](/config/experimental#experimental-diagnostics). Hints never suggest changing an option that was set explicitly.

[`vitest doctor`](/guide/cli#vitest-doctor) measures the alternative configurations instead of estimating them: it runs the suite under each candidate and reports the comparison, including whether the tests pass with `isolate: false`.

## Test Isolation

By default Vitest runs every test file in an isolated environment based on the [pool](/config/pool):

- `threads` pool runs every test file in a separate [`Worker`](https://nodejs.org/api/worker_threads.html#class-worker)
- `forks` pool runs every test file in a separate [forked child process](https://nodejs.org/api/child_process.html#child_processforkmodulepath-args-options)
- `vmThreads` pool runs every test file in a separate [VM context](https://nodejs.org/api/vm.html#vmcreatecontextcontextobject-options), but it uses workers for parallelism

This greatly increases test times, which might not be desirable for projects that don't rely on side effects and properly cleanup their state (which is usually true for projects with `node` environment). In this case disabling isolation will improve the speed of your tests. To do that, you can provide `--no-isolate` flag to the CLI or set [`test.isolate`](/config/isolate) property in the config to `false`.

::: code-group

```bash [CLI]
vitest --no-isolate
```

```ts [vitest.config.js]
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    isolate: false,
  },
})
```

:::

You can also disable isolation for specific files only by using `projects`:

```ts [vitest.config.js]
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'Isolated',
          isolate: true, // (default value)
          exclude: ['**.non-isolated.test.ts'],
        },
      },
      {
        test: {
          name: 'Non-isolated',
          isolate: false,
          include: ['**.non-isolated.test.ts'],
        },
      },
    ],
  },
})
```

:::tip
If you are using `vmThreads` pool, you cannot disable isolation. Use `threads` pool instead to improve your tests performance.
:::

For some projects, it might also be desirable to disable parallelism to improve startup time. To do that, provide `--no-file-parallelism` flag to the CLI or set [`test.fileParallelism`](/config/fileparallelism) property in the config to `false`.

::: code-group

```bash [CLI]
vitest --no-file-parallelism
```

```ts [vitest.config.js]
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    fileParallelism: false,
  },
})
```

:::

## Test Environments

DOM environments are expensive to create: `jsdom` costs roughly 200-500ms per import and `happy-dom` roughly 90-200ms, plus the time to construct the window. With an isolating pool (the default), that cost is paid for every test file, because every file gets a fresh worker. On DOM-heavy suites this is often the largest cost of the run; it appears as the `environment` share of the `Duration` breakdown.

Three configurations reduce this cost:

| configuration                                           | environment created | isolation                                                              | trade-off                                                                                                                                                                            |
| ------------------------------------------------------- | ------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pool: 'forks'`/`'threads'` + `isolate: true` (default) | once per file       | fresh process/thread and environment per file                          | safest, slowest                                                                                                                                                                      |
| `pool: 'vmThreads'`                                     | once per worker     | fresh VM context and `window` per file                                 | test code runs in a VM realm: cross-realm `instanceof` edge cases with externalized packages, and memory is not reclaimed as reliably (see [`vmMemoryLimit`](/config/vmmemorylimit)) |
| `isolate: false`                                        | once per worker     | none - files in the same worker share the environment and module state | tests must not depend on a clean `window` or module state; run `vitest doctor` to check                                                                                              |

```ts [vitest.config.js]
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    pool: 'vmThreads', // environment per worker, fresh window per file
  },
})
```

Prefer `isolate: false` with `threads` if the tests tolerate shared state: it is the fastest option and keeps memory behavior simple. Use `vmThreads` when every file needs a fresh `window` and the per-file environment cost dominates the run. `happy-dom` is cheaper to create than `jsdom` in every setup.

## Limiting Directory Search

You can limit the working directory when Vitest searches for files using [`test.dir`](/config/dir) option. This should make the search faster if you have unrelated folders and files in the root directory.

## Caching Between Reruns

In watch mode, Vitest caches all transformed files in memory, which makes reruns fast. However, this cache is discarded once the test run finishes. With [`fsModuleCache`](/config/fsmodulecache) (enabled by default), Vitest persists this cache to the file system so it can be reused across reruns.

This improvement is most noticeable when rerunning a small number of tests that depend on a large module graph. For full test suites, parallelization already mitigates the cost because other tests populate the in-memory cache while earlier tests are still running. For example, running one test file with a huge module graph (>900 modules):

```shell
# the first run
Duration  8.75s (import 43%, transform 32%, tests 20%, setup 5%)

# the second run
Duration  5.90s (tests 44%, import 35%, transform 13%, setup 8%)
```

## Node Compile Cache

Vitest supports Node's [on-disk compile cache](https://nodejs.org/api/cli.html#node_compile_cachedir): when the `NODE_COMPILE_CACHE` environment variable points at a directory, the V8 bytecode of Vitest's own modules and of your externalized dependencies is written to disk and reused by later runs instead of being recompiled. Vitest propagates the variable to every worker, and workers persist the modules they compiled when they shut down.

```shell
NODE_COMPILE_CACHE=node_modules/.cache/node-compile-cache vitest
```

The first run with an empty directory pays for serializing the compiled modules, so this is only worth enabling when the directory survives between runs: local runs, or CI pipelines that cache the directory. `NODE_DISABLE_COMPILE_CACHE=1` disables the cache entirely, taking precedence over `NODE_COMPILE_CACHE`.

Note that Vitest automatically disables the compile cache in workers when the `v8` coverage provider is enabled — V8 serializes cached scripts without the source positions that precise coverage relies on.

## Pool

By default Vitest runs tests in `pool: 'forks'`. While `'forks'` pool is better for compatibility issues ([hanging process](/guide/common-errors#failed-to-terminate-worker) and [segfaults](/guide/common-errors#segfaults-and-native-code-errors)), it may be slightly slower than `pool: 'threads'` in larger projects.

You can try to improve test run time by switching `pool` option in configuration:

::: code-group

```bash [CLI]
vitest --pool=threads
```

```ts [vitest.config.js]
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    pool: 'threads',
  },
})
```

:::

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

<!-- Source: https://vitest.dev/guide/profiling-test-performance | docs/guide/profiling-test-performance.md -->

# Profiling Test Performance

When you run Vitest it reports multiple time metrics of your tests:

> ```bash
> RUN  v2.1.1 /x/vitest/examples/profiling
>
> ✓ test/prime-number.test.ts (1) 4517ms
>   ✓ generate prime number 4517ms
>
> Test Files  1 passed (1)
>      Tests  1 passed (1)
>   Start at  09:32:53
>   Duration  4.80s (transform 44ms, setup 0ms, import 35ms, tests 4.52s, environment 0ms)
>   # Time metrics ^^
> ```

- Transform: How much time was spent transforming the files. See [File Transform](#file-transform).
- Setup: Time spent for running the [`setupFiles`](/config/setupfiles) files.
- Import: Time it took to import your test files and their dependencies. This also includes the time spent collecting all tests. Note that this doesn't include dynamic imports inside of tests.
- Tests: Time spent for actually running the test cases.
- Environment: Time spent for setting up the test [`environment`](/config/environment), for example JSDOM.

## Test Runner

In cases where your test execution time is high, you can generate a profile of the test runner. See NodeJS documentation for following options:

- [`--cpu-prof`](https://nodejs.org/api/cli.html#--cpu-prof)
- [`--heap-prof`](https://nodejs.org/api/cli.html#--heap-prof)
- [`--prof`](https://nodejs.org/api/cli.html#--prof)

:::warning
The `--prof` option does not work with `pool: 'threads'` due to `node:worker_threads` limitations.
:::

To pass these options to Vitest's test runner, define `execArgv` in your Vitest configuration:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    fileParallelism: false,
    execArgv: [
      '--cpu-prof',
      '--cpu-prof-dir=test-runner-profile',
      '--heap-prof',
      '--heap-prof-dir=test-runner-profile'
    ],
  },
})
```

After the tests have run there should be a `test-runner-profile/*.cpuprofile` and `test-runner-profile/*.heapprofile` files generated. See [Inspecting profiling records](#inspecting-profiling-records) for instructions how to analyze these files.

See [Profiling | Examples](https://github.com/vitest-dev/vitest/tree/main/examples/profiling) for example.

## Main Thread

Profiling main thread is useful for debugging Vitest's Vite usage and [`globalSetup`](/config/globalsetup) files.
This is also where your Vite plugins are running.

:::tip
See [Performance | Vite](https://vitejs.dev/guide/performance.html) for more tips about Vite specific profiling.

We recommend [`vite-plugin-inspect`](https://github.com/antfu-collective/vite-plugin-inspect) for profiling your Vite plugin performance.
:::

To do this you'll need to pass arguments to the Node process that runs Vitest.

```bash
$ node --cpu-prof --cpu-prof-dir=main-profile ./node_modules/vitest/vitest.mjs --run
#      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^                                  ^^^^^
#               NodeJS arguments                                           Vitest arguments
```

After the tests have run there should be a `main-profile/*.cpuprofile` file generated. See [Inspecting profiling records](#inspecting-profiling-records) for instructions how to analyze these files.

## File Transform

This profiling strategy is a good way to identify unnecessary transforms caused by [barrel files](https://vitejs.dev/guide/performance.html#avoid-barrel-files).
If these logs contain files that should not be loaded when your test is run, you might have barrel files that are importing files unnecessarily.

You can also use [Vitest UI](/guide/ui) to debug slowness caused by barrel file.
The example below shows how importing files without barrel file reduces amount of transformed files by ~85%.

::: code-group

```[File tree]
├── src
│   └── utils
│       ├── currency.ts
│       ├── formatters.ts  <-- File to test
│       ├── index.ts
│       ├── location.ts
│       ├── math.ts
│       ├── time.ts
│       └── users.ts
├── test
│   └── formatters.test.ts
└── vitest.config.ts
```

```ts [example.test.ts]
import { expect, test } from 'vitest'
import { formatter } from '../src/utils' // [!code --]
import { formatter } from '../src/utils/formatters' // [!code ++]

test('formatter works', () => {
  expect(formatter).not.toThrow()
})
```

:::

<img src="/module-graph-barrel-file.png" alt="Vitest UI demonstrating barrel file issues" />

To see how files are transformed, you can open the "Module Info" view in the UI:

<img alt="The module info view for an inlined module" img-light src="/ui/light-module-info.png">
<img alt="The module info view for an inlined module" img-dark src="/ui/dark-module-info.png">

## File Import

Some modules just take a long time to load. To identify which modules are the slowest, enable [`experimental.importDurations`](/config/experimental#experimental-importdurations) in your configuration:

```ts [vitest.config.ts]
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    experimental: {
      importDurations: {
        print: true,
      },
    },
  },
})
```

This will print a breakdown of the slowest imports after your tests finish:

```bash
Import Duration Breakdown (Top 10)

Module                      Self     Total
my-test.test.ts              5ms    620ms [████████████████████]
date-fns/index.js          500ms    500ms [████████████████░░░░] # [!code error]
src/utils/helpers.ts        10ms    120ms [████████░░░░░░░░░░░░]
```

You can also use `--experimental.importDurations.print` from the CLI without changing your configuration:

```bash
vitest --experimental.importDurations.print
```

Once you've identified the slow modules, there are several strategies to speed up imports:

### Use Specific Entry Points

Many libraries ship multiple entry points. Importing the main entry point (which is often a [barrel file](https://vitejs.dev/guide/performance.html#avoid-barrel-files)) can pull in far more code than you need.

For example, `date-fns` re-exports hundreds of functions from its main entry point. Instead of importing from the top-level module, import directly from the specific function:

```ts
import { format } from 'date-fns' // [!code --]
import { format } from 'date-fns/format' // [!code ++]
```

### Use `resolve.alias` to Redirect Imports

If a dependency doesn't provide granular entry points, or if third-party code imports the heavy entry point, you can use [`resolve.alias`](https://vite.dev/config/shared-options#resolve-alias) to redirect imports to a lighter alternative:

```ts [vitest.config.ts]
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^date-fns$/,
        replacement: join(dirname(require.resolve('date-fns/package.json')), 'index.cjs'),
      },
    ]
  },
})
```

### Use the Dependency Optimizer

Vitest can bundle external libraries into a single file using [`deps.optimizer`](/config/deps#deps-optimizer), which reduces the overhead of importing packages with many internal modules:

```ts [vitest.config.ts]
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    deps: {
      optimizer: {
        ssr: {
          enabled: true,
          include: ['date-fns'],
        },
      },
    },
  },
})
```

This is especially effective for UI libraries and packages with deep import trees. Use `optimizer.ssr` for `node`/`edge` environments and `optimizer.client` for `jsdom`/`happy-dom` environments.

## Code Coverage

If code coverage generation is slow on your project you can use `DEBUG=vitest:coverage` environment variable to enable performance logging.

```bash
$ DEBUG=vitest:coverage vitest --run --coverage

 RUN  v3.1.1 /x/vitest-example

  vitest:coverage Reading coverage results 2/2
  vitest:coverage Converting 1/2
  vitest:coverage 4 ms /x/src/multiply.ts
  vitest:coverage Converting 2/2
  vitest:coverage 552 ms /x/src/add.ts
  vitest:coverage Uncovered files 1/2
  vitest:coverage File "/x/src/large-file.ts" is taking longer than 3s # [!code error]
  vitest:coverage 3027 ms /x/src/large-file.ts
  vitest:coverage Uncovered files 2/2
  vitest:coverage 4 ms /x/src/untested-file.ts
  vitest:coverage Generate coverage total time 3521 ms
```

This profiling approach is great for detecting large files that are accidentally picked by coverage providers.
For example if your configuration is accidentally including large built minified Javascript files in code coverage, they should appear in logs.
In these cases you might want to adjust your [`coverage.include`](/config/coverage#coverage-include) and [`coverage.exclude`](/config/coverage#coverage-exclude) options.

## Inspecting Profiling Records

You can inspect the contents of `*.cpuprofile` and `*.heapprofile` with various tools. See list below for examples.

- [Speedscope](https://www.speedscope.app/)
- [Performance Profiling JavaScript in Visual Studio Code](https://code.visualstudio.com/docs/nodejs/profiling#_analyzing-a-profile)
- [Profile Node.js performance with the Performance panel | developer.chrome.com](https://developer.chrome.com/docs/devtools/performance/nodejs#analyze)
- [Memory panel overview | developer.chrome.com](https://developer.chrome.com/docs/devtools/memory-problems/heap-snapshots#view_snapshots)

<!-- Source: https://vitest.dev/guide/recipes/disable-isolation | docs/guide/recipes/disable-isolation.md -->

# Per-File Isolation Settings

By default, every test file runs in its own isolated module graph, which protects against one file leaking state into another. That isolation costs setup time on every file, which is fine for integration tests that genuinely need it and wasted on pure unit tests that don't share mutable state.

Use [`projects`](/guide/projects) to apply [`isolate: false`](/config/isolate) to the unit suite while keeping the integration suite isolated.

## Pattern

```ts [vitest.config.ts]
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          // Non-isolated unit tests
          name: 'Unit tests',
          isolate: false,
          exclude: ['**.integration.test.ts'],
        },
      },
      {
        test: {
          // Isolated integration tests
          name: 'Integration tests',
          include: ['**.integration.test.ts'],
        },
      },
    ],
  },
})
```

## When isolation matters

A test file is safe to deisolate when it does not:

- mutate module-level state (counters, caches, top-level `let` bindings)
- call [`vi.stubGlobal`](/api/vi#vi-stubglobal) or [`vi.stubEnv`](/api/vi#vi-stubenv)
- monkey-patch prototypes (`Date.prototype`, `Array.prototype`, …)
- register listeners on `process` or other long-lived emitters
- depend on a fresh module instance for `vi.mock` factories

If any of those apply, isolation is doing real work and should stay on.

## Verifying it's safe

Run the suite twice with shuffling to surface inter-file pollution:

```sh
vitest --shuffle --run --project='Unit tests'
vitest --shuffle --run --project='Unit tests'
```

If the second run produces different results, you have order-dependent tests. Either fix the offender or leave isolation enabled for that file.

## Per-pool isolation

`isolate` only governs the [`threads`](/config/pool) and [`forks`](/config/pool) pools. The `vmThreads` and `vmForks` pools always run isolated regardless of the flag, since they trade startup cost for stronger guarantees.

## See also

- [`isolate`](/config/isolate)
- [Test Projects](/guide/projects)
- [Improving Performance](/guide/improving-performance)
- [Parallel and Sequential Test Files](/guide/recipes/parallel-sequential)

<!-- Source: https://vitest.dev/guide/open-telemetry | docs/guide/open-telemetry.md -->

# Open Telemetry Support <Experimental /> {#open-telemetry-support}

::: tip FEEDBACK
Please, leave feedback regarding this feature in a [GitHub Discussion](https://github.com/vitest-dev/vitest/discussions/9222).
:::

::: tip Example Project
[GitHub](https://github.com/vitest-dev/vitest/tree/main/examples/opentelemetry)
:::

[OpenTelemetry](https://opentelemetry.io/) traces can be a useful tool to debug the performance and behavior of your application inside tests.

If enabled, Vitest integration generates spans that are scoped to your test's worker.

::: warning
OpenTelemetry initialization increases the startup time of every test unless Vitest runs without [isolation](/config/isolate). You can see it as the `vitest.runtime.traces` span inside `vitest.worker.start`.
:::

To start using OpenTelemetry in Vitest, specify an SDK module path via [`experimental.openTelemetry.sdkPath`](/config/experimental#experimental-opentelemetry) and set `experimental.openTelemetry.enabled` to `true`. Vitest will automatically instrument the whole process and each individual test worker.

Make sure to export the SDK as a default export, so that Vitest can flush the network requests before the process is closed. Note that Vitest doesn't automatically call `start`.

## Quickstart

Before previewing your application traces, install required packages and specify the path to your instrumentation file in the config.

```shell
npm i @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-trace-otlp-proto
```

::: code-group

```js{12} [otel.js]
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { NodeSDK } from '@opentelemetry/sdk-node'

const sdk = new NodeSDK({
  serviceName: 'vitest',
  traceExporter: new OTLPTraceExporter(),
  instrumentations: [getNodeAutoInstrumentations()],
})

sdk.start()
export default sdk
```

```js [vitest.config.js]
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    experimental: {
      openTelemetry: {
        enabled: true,
        sdkPath: './otel.js',
      },
    },
  },
})
```

:::

::: danger FAKE TIMERS
If you are using fake timers, it is important to reset them before the test ends, otherwise traces might not be tracked properly.
:::

Vitest doesn't process the `sdkPath` module, so it is important that the SDK can be imported within your Node.js environment. It is ideal to use the `.js` extension for this file. Using another extension will slow down your tests and may require providing additional Node.js arguments.

If you want to provide a TypeScript file, make sure to familiarize yourself with [TypeScript](https://nodejs.org/api/typescript.html#type-stripping) page in the Node.js documentation.

## Custom Traces

You can use the OpenTelemetry API yourself to track certain operations in your code. Custom traces automatically inherit the Vitest OpenTelemetry context:

```ts
import { trace } from '@opentelemetry/api'
import { test } from 'vitest'
import { db } from './src/db'

const tracer = trace.getTracer('vitest')

test('db connects properly', async () => {
  // this is shown inside `vitest.test.runner.test.callback` span
  await tracer.startActiveSpan('db.connect', () => db.connect())
})
```

## Browser Mode

When running tests in [browser mode](/guide/browser/), Vitest propagates trace context between Node.js and the browser. Node.js side traces (test orchestration, browser driver communication) are available without additional configuration.

To capture traces from the browser runtime, provide a browser-compatible SDK via `browserSdkPath`:

```shell
npm i @opentelemetry/sdk-trace-web @opentelemetry/exporter-trace-otlp-proto
```

::: code-group

```js [otel-browser.js]
import {
  BatchSpanProcessor,
  WebTracerProvider,
} from '@opentelemetry/sdk-trace-web'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'

const provider = new WebTracerProvider({
  spanProcessors: [
    new BatchSpanProcessor(new OTLPTraceExporter()),
  ],
})

provider.register()
export default provider
```

```js [vitest.config.js]
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      provider: 'playwright',
      instances: [{ browser: 'chromium' }],
    },
    experimental: {
      openTelemetry: {
        enabled: true,
        sdkPath: './otel.js',
        browserSdkPath: './otel-browser.js',
      },
    },
  },
})
```

:::

::: warning ASYNC CONTEXT
Unlike Node.js, browsers do not have automatic async context propagation. Vitest handles this internally for test execution, but custom spans in deeply nested async code may not propagate context automatically.
:::

## View Traces

To generate traces, run Vitest as usual. You can run Vitest in either watch mode or run mode. Vitest will call `sdk.shutdown()` manually after everything is finished to make sure traces are handled properly.

You can view traces using any of the open source or commercial products that support OpenTelemetry API. If you did not use OpenTelemetry before, we recommend starting with [Jaeger](https://www.jaegertracing.io/docs/2.11/getting-started/#all-in-one) because it is really easy to setup.

<img src="/otel-jaeger.png" alt="an example of open telemetry result in jaeger" />

## `@opentelemetry/api`

Vitest declares `@opentelemetry/api` as an optional peer dependency, which it uses internally to generate spans. When trace collection is not enabled, Vitest will not attempt to use this dependency.

When configuring Vitest to use OpenTelemetry, you will typically install `@opentelemetry/sdk-node`, which includes `@opentelemetry/api` as a transitive dependency, thereby satisfying Vitest's peer dependency requirement. If you encounter an error indicating that `@opentelemetry/api` cannot be found, this typically means trace collection has not been enabled. If the error persists after proper configuration, you may need to install `@opentelemetry/api` explicitly.

## Inter-Process Context Propagation

Vitest supports automatic context propagation from parent processes via the `TRACEPARENT` and `TRACESTATE` environment variables as defined in the [OpenTelemetry specification](https://github.com/open-telemetry/opentelemetry-specification/blob/main/specification/context/env-carriers.md). This is particularly useful when running Vitest as part of a larger distributed tracing system (e.g., CI/CD pipelines with OpenTelemetry instrumentation).
