<!-- Verbatim excerpts from the official Vitest documentation, v5.1.1 (https://github.com/vitest-dev/vitest/tree/161e25f663a838f6a30890f8a6827ff83ff1b3c7/docs).
     Only this comment, the H1, the table of contents, and the "Source:" comments are generated. Every other line is copied from the docs.
     Root-relative links (e.g. /api/vi) resolve against https://vitest.dev. Do not edit. Regenerate with scripts/build.mjs. -->

# Watch Mode

## Table of Contents

1. Watch Mode (guide/features.md)
2. Watching Non-Imported Files (guide/recipes/watch-templates.md)
   - Pattern
   - Variations
   - See also

<!-- Source: https://vitest.dev/guide/features | docs/guide/features.md | section: ## Watch Mode -->

## Watch Mode

```bash
$ vitest
```

When you modify your source code or the test files, Vitest smartly searches the module graph and only reruns the related tests, just like how HMR works in Vite!

`vitest` starts in `watch mode` **by default in development environment** and `run mode` in CI environment (when `process.env.CI` presents) smartly. You can use `vitest watch` or `vitest run` to explicitly specify the desired mode.

Start Vitest with the `--standalone` flag to keep it running in the background. It won't run any tests until they change. Vitest will not run tests if the source code is changed until the test that imports the source has been run

<!-- Source: https://vitest.dev/guide/recipes/watch-templates | docs/guide/recipes/watch-templates.md -->

# Watching Non-Imported Files

In watch mode, Vitest tracks the import graph: when you change a file, every test whose imports reach that file reruns. That covers most cases. It misses tests that depend on files they don't `import`, like email templates loaded with `fs.readFile`, JSON fixtures parsed at runtime, HTML or CSS pulled in by a build step, or generated artifacts the tests assert against. Editing one of those files leaves the related tests stale, and the watch loop has no way to know.

[`watchTriggerPatterns`](/config/watchtriggerpatterns) <Version>3.2.0</Version> makes these dependencies explicit. You declare a regex over file paths and a callback that returns which tests to rerun when a matching file changes.

## Pattern

```ts [vitest.config.ts]
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    watchTriggerPatterns: [
      {
        pattern: /src\/templates\/(.*)\.(ts|html|txt)$/,
        testsToRun: (file, match) => {
          // edit `src/templates/welcome.html` ⇒ rerun `api/tests/mailers/welcome.test.ts`
          return `api/tests/mailers/${match[1]}.test.ts`
        },
      },
    ],
  },
})
```

`testsToRun` returns one or more test file paths to rerun (as a string or string array), or `undefined` if no tests should rerun. Paths are resolved against the workspace root and are not interpreted as globs. `match` is the result of `RegExp.exec` against the changed file.

## Variations

Multiple patterns can coexist. The first below derives the test path from the directory of the changed file; the second maps a single shared fixture to a fixed list of test files:

```ts [vitest.config.ts]
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    watchTriggerPatterns: [
      {
        pattern: /src\/(.*)\/schema\.json$/,
        testsToRun: (_file, match) => `src/${match[1]}/__tests__/index.test.ts`,
      },
      {
        pattern: /test\/shared-fixture\.json$/,
        testsToRun: () => [
          'test/integration/users.test.ts',
          'test/integration/billing.test.ts',
        ],
      },
    ],
  },
})
```

[`forceRerunTriggers`](/config/forcereruntriggers) covers the same general gap, except it reruns every test on every match. `watchTriggerPatterns` reruns only the tests you map for a given pattern, which keeps the watch loop fast.

## See also

- [`watchTriggerPatterns`](/config/watchtriggerpatterns)
- [`forceRerunTriggers`](/config/forcereruntriggers)
