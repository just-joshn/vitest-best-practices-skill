<!-- Verbatim excerpts from the official Vitest documentation, v5.1.1 (https://github.com/vitest-dev/vitest/tree/161e25f663a838f6a30890f8a6827ff83ff1b3c7/docs).
     Only this comment, the H1, the table of contents, and the "Source:" comments are generated. Every other line is copied from the docs.
     Root-relative links (e.g. /api/vi) resolve against https://vitest.dev. Do not edit. Regenerate with scripts/build.mjs. -->

# GitHub Actions

## Table of Contents

1. GitHub Actions Reporter (guide/reporters.md)
2. github-actions (guide/test-annotations.md)
3. Sharding (guide/improving-performance.md)
4. View Reports from CI (guide/ui.md)

<!-- Source: https://vitest.dev/guide/reporters | docs/guide/reporters.md | section: ### GitHub Actions Reporter {#github-actions-reporter} -->

### GitHub Actions Reporter {#github-actions-reporter}

Output [workflow commands](https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions#setting-an-error-message)
to provide annotations for test failures. This reporter is [enabled automatically](#default-configuration) when `process.env.GITHUB_ACTIONS === 'true'` (on GitHub Actions environment).

<img alt="GitHub Actions" img-dark src="https://github.com/vitest-dev/vitest/assets/4232207/336cddc2-df6b-4b8a-8e72-4d00010e37f5">
<img alt="GitHub Actions" img-light src="https://github.com/vitest-dev/vitest/assets/4232207/ce8447c1-0eab-4fe1-abef-d0d322290dca">

You can customize the file paths that are printed in [GitHub's annotation command format](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/workflow-commands-for-github-actions) by using the `onWritePath` option. This is useful when running Vitest in a containerized environment, such as Docker, where the file paths may not match the paths in the GitHub Actions environment.

```ts
export default defineConfig({
  test: {
    reporters: process.env.GITHUB_ACTIONS === 'true'
      ? [
          'default',
          ['github-actions', { onWritePath(path) {
            return path.replace(/^\/app\//, `${process.env.GITHUB_WORKSPACE}/`)
          } }],
        ]
      : ['default'],
  },
})
```

If you are using [Annotations API](/guide/test-annotations), the reporter will automatically inline them in the GitHub UI. You can disable this by setting `displayAnnotations` option to `false`:

```ts
export default defineConfig({
  test: {
    reporters: [
      ['github-actions', { displayAnnotations: false }],
    ],
  },
})
```

The GitHub Actions reporter automatically generates a [Job Summary](https://github.blog/news-insights/product-news/supercharging-github-actions-with-job-summaries/) with an overview of your test results. The summary includes test file and test case statistics, and highlights flaky tests that required retries.

<img alt="GitHub Actions Job Summary" img-dark src="/github-actions-job-summary-dark.png">
<img alt="GitHub Actions Job Summary" img-light src="/github-actions-job-summary-light.png">

The job summary is enabled by default and writes to the path specified by `$GITHUB_STEP_SUMMARY`. You can override it by using the `jobSummary.outputPath` option:

```ts
export default defineConfig({
  test: {
    reporters: [
      ['github-actions', {
        jobSummary: {
          outputPath: '/home/runner/jobs/summary/step',
        },
      }],
    ],
  },
})
```

To disable the job summary:

```ts
export default defineConfig({
  test: {
    reporters: [
      ['github-actions', { jobSummary: { enabled: false } }],
    ],
  },
})
```

The job summary title defaults to `Vitest Test Report` or `(${test.name}) Vitest Test Report` when [`test.name` is set](/config/name).

You can customize the title by setting `jobSummary.title` to distinguish multiple Vitest invocations that append to the same job summary. Please note that `test.name` will not be displayed when using a custom title.

```ts
export default defineConfig({
  test: {
    reporters: [
      ['github-actions', {
        jobSummary: {
          title: 'My Test Report',
        },
      }],
    ],
  },
})
```

The flaky tests section of the summary includes permalink URLs that link test names directly to the relevant source lines on GitHub. These links are generated automatically using environment variables that GitHub Actions provides (`$GITHUB_REPOSITORY`, `$GITHUB_SHA`, and `$GITHUB_WORKSPACE`), so no configuration is needed in most cases.

If you need to override these values — for example, when running in a container or a custom environment — you can customize them via the `fileLinks` option:

- `repository`: the GitHub repository in `owner/repo` format. Defaults to `process.env.GITHUB_REPOSITORY`.
- `commitHash`: the commit SHA to use in permalink URLs. Defaults to `process.env.GITHUB_SHA`.
- `workspacePath`: the absolute path to the root of the repository on disk. Used to compute relative file paths for the permalink URLs. Defaults to `process.env.GITHUB_WORKSPACE`.

All three values must be available for the links to be generated.

```ts
export default defineConfig({
  test: {
    reporters: [
      ['github-actions', {
        jobSummary: {
          fileLinks: {
            repository: 'owner/repo',
            commitHash: 'abcdefg',
            workspacePath: '/home/runner/work/repo/',
          },
        },
      }],
    ],
  },
})
```

<!-- Source: https://vitest.dev/guide/test-annotations | docs/guide/test-annotations.md | section: ### github-actions -->

### github-actions

The `github-actions` reporter will print the annotation as a [notice message](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/workflow-commands-for-github-actions#setting-a-notice-message) by default. You can configure the `type` by passing down the second argument as `notice`, `warning` or `error`. If type is none of these, Vitest will show the message as a notice.

<img alt="GitHub Actions" img-light src="/annotations-gha-light.png">
<img alt="GitHub Actions" img-dark src="/annotations-gha-dark.png">

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

<!-- Source: https://vitest.dev/guide/ui | docs/guide/ui.md | section: ### View Reports from CI -->

### View Reports from CI

To view the HTML report from CI, for example in GitHub Actions, upload the output directory as an artifact:

```yaml
- uses: actions/upload-artifact@v7
  id: upload-report
  with:
    name: vitest-report
    path: .vitest/

- name: Link HTML report
  run: echo "::notice title=Vitest HTML report::$REPORT_URL"
  env:
    REPORT_URL: https://viewer.vitest.dev/?url=${{ steps.upload-report.outputs.artifact-url }}
```

This adds the report link as a notice annotation on the workflow run. Click it to open the report in [Vitest Viewer](https://viewer.vitest.dev/) directly in the browser. You can also download the artifact manually and extract it, then run `vite preview` locally as above.

When you use `singleFile: true`, you can upload the report as a single file and view it directly from GitHub artifacts with the [`archive: false` option](https://github.com/actions/upload-artifact#upload-an-individual-file-unzipped):

```yaml
- uses: actions/upload-artifact@v7
  id: upload-report
  with:
    path: .vitest/index.html
    archive: false

- name: Link HTML report
  run: echo "::notice title=Vitest HTML report::$REPORT_URL"
  env:
    REPORT_URL: ${{ steps.upload-report.outputs.artifact-url }}
```
