<!-- Verbatim excerpts from the official Vitest documentation, v5.1.1 (https://github.com/vitest-dev/vitest/tree/161e25f663a838f6a30890f8a6827ff83ff1b3c7/docs).
     Only this comment, the H1, the table of contents, and the "Source:" comments are generated. Every other line is copied from the docs.
     Root-relative links (e.g. /api/vi) resolve against https://vitest.dev. Do not edit. Regenerate with scripts/build.mjs. -->

# Global Setup & Setup Files

## Table of Contents

1. globalSetup (config/globalsetup.md)
   - Handling Test Reruns
2. setupFiles (config/setupfiles.md)

<!-- Source: https://vitest.dev/config/globalsetup | docs/config/globalsetup.md -->

# globalSetup

- **Type:** `string | string[]`

Path to global setup files relative to project [root](/config/root).

A global setup file can either export named functions `setup` and `teardown` or a `default` function that returns a teardown function:

::: code-group

```js [exports]
export function setup(project) {
  console.log('setup')
}

export function teardown() {
  console.log('teardown')
}
```

```js [default]
export default function setup(project) {
  console.log('setup')

  return function teardown() {
    console.log('teardown')
  }
}
```

:::

Note that the `setup` method and a `default` function receive a [test project](/api/advanced/test-project) as the first argument. The global setup is called before the test workers are created and only if there is at least one test queued, and teardown is called after all test files have finished running. In [watch mode](/config/watch), the teardown is called before the process is exited instead. If you need to reconfigure your setup before the test rerun, you can use [`onTestsRerun`](#handling-test-reruns) hook instead.

Multiple global setup files are possible. `setup` and `teardown` are executed sequentially with teardown in reverse order.

::: danger
Beware that the global setup is running in a different global scope before test workers are even created, so your tests don't have access to global variables defined here. However, you can pass down serializable data to tests via [`provide`](/config/provide) method and read them in your tests via `inject` imported from `vitest`:

:::code-group

```ts [example.test.ts]
import { inject } from 'vitest'

inject('wsPort') === 3000
```

```ts [globalSetup.ts]
import type { TestProject } from 'vitest/node'

export default function setup(project: TestProject) {
  project.provide('wsPort', 3000)
}

declare module 'vitest' {
  export interface ProvidedContext {
    wsPort: number
  }
}
```

If you need to execute code in the same process as tests, use [`setupFiles`](/config/setupfiles) instead, but note that it runs before every test file.
:::

## Handling Test Reruns

You can define a custom callback function to be called when Vitest reruns tests. The test runner will wait for it to complete before executing tests. Note that you cannot destruct the `project` like `{ onTestsRerun }` because it relies on the context.

```ts [globalSetup.ts]
import type { TestProject } from 'vitest/node'

export default function setup(project: TestProject) {
  project.onTestsRerun(async () => {
    await restartDb()
  })
}
```

<!-- Source: https://vitest.dev/config/setupfiles | docs/config/setupfiles.md -->

# setupFiles

- **Type:** `string | string[]`

Paths to setup files resolved relative to the [`root`](/config/root). They will run before each _test file_ in the same process. By default, setup files run one after another in the order they are defined, but you can configure it with [`sequence.setupFiles`](/config/sequence#sequence-setupfiles) option.

Vitest will ignore any exports from these files.

:::warning
Note that setup files are executed in the same process as tests, unlike [`globalSetup`](/config/globalsetup) that runs once in the main thread before any test worker is created.
:::

:::info
Editing a setup file will automatically trigger a rerun of all tests.
:::

If you have a heavy process running in the background, you can use `process.env.VITEST_POOL_ID` (integer-like string) inside to distinguish between workers and spread the workload.

:::warning
If [isolation](/config/isolate) is disabled, imported modules are cached, but the setup file itself is executed again before each test file, meaning that you are accessing the same global object before each test file. Make sure you are not doing the same thing more than necessary.

For example, you may rely on a global variable:

```ts
import { config } from '@some-testing-lib'

if (!globalThis.setupInitialized) {
  config.plugins = [myCoolPlugin]
  computeHeavyThing()
  globalThis.setupInitialized = true
}

// hooks reset before each test file
afterEach(() => {
  cleanup()
})

globalThis.resetBeforeEachTest = true
```

:::
