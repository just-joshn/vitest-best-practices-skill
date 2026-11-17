# Configure Vitest

## When to use

- When the request is to change Vitest config, such as the test environment, projects, setup files, or coverage
- When the request is to change what Vitest prints or writes, such as reporters or CI output
- When the request is to change what reruns in watch mode, or which tests run for a change

## Investigate and establish evidence

1. Process: Record the request, the current behavior, and the output that shows it, before changing any file.
2. Find the config file Vitest loads. If `--config` is not passed, read the lookup order, because [configuration](../references/core/configuration.md "When an explicit `--config` option is not provided, Vitest looks for `vitest.config.{ts,mts,cts,js,mjs,cjs}` first and `vite.config.{ts,mts,cts,js,mjs,cjs}` second in the project [`root`](/config/root).").
3. If a `vitest.config` file is created, all options in the `vite.config` file are ignored, because [configuration](../references/core/configuration.md "it means all options in your `vite.config` will be **ignored**").
4. Check the scripts and CI commands for `--config`, because [configuration](../references/core/configuration.md "Pass `--config` option to CLI, e.g. `vitest --config ./path/to/vitest.config.ts`").
5. Read the current `environment` value in that file, because [configuration](../references/core/configuration.md "Vitest provides [`environment`](/config/environment) option to run code inside a specific environment.").
6. If the config has `projects`, list the projects and their names, because [projects-dependencies](../references/core/projects-dependencies.md "All projects must have unique names; otherwise, Vitest will throw an error.").
7. For each project, check whether it inherits the root options, because [projects-dependencies](../references/core/projects-dependencies.md "Projects defined with an inline configuration inherit all options from the root-level configuration.").
8. Record whether the suite is started today with `vitest`, `vitest run`, or `vitest watch`, because [watch-mode](../references/infrastructure-ci-cd/watch-mode.md "`vitest` starts in `watch mode` **by default in development environment** and `run mode` in CI environment (when `process.env.CI` presents) smartly. You can use `vitest watch` or `vitest run` to explicitly specify the desired mode.").
9. Process: Name the one setting the request needs. If no documented option matches, say the Vitest docs do not cover it.

## Design and implement

1. For the test environment of all tests, set `environment`, because [configuration](../references/core/configuration.md "When setting `environment` option in your config, it will apply to all the test files in your project.").
2. For one file, use a control comment, because [configuration](../references/core/configuration.md "To have more fine-grained control, you can use control comments to specify environment for specific files.").
3. To run part of the tests using Browser Mode, create a test project, because [configuration](../references/core/configuration.md "If you wish to run part of your tests using [Browser Mode](/guide/browser/), you can create a [test project](/guide/browser/#projects-config).")
4. To weigh a simulated browser against a real one, read the caveat, because [test-architecture](../references/architecture/test-architecture.md "these tools only simulate a browser environment and not an actual browser").
5. Projects can be used to run tests with different configurations, because [projects-dependencies](../references/core/projects-dependencies.md "This feature is particularly useful for monorepo setups but can also be used to run tests with different configurations, such as `resolve.alias`, `plugins`, or `test.browser` and more.").
6. Make sure no two projects share a `name`, because [projects-dependencies](../references/core/projects-dependencies.md "All projects must have unique names; otherwise, Vitest will throw an error.").
7. Projects defined with an inline configuration inherit all root options, and the `extends` option controls this, enabled by default since Vitest 5.0, because [projects-dependencies](../references/core/projects-dependencies.md "Projects defined with an inline configuration inherit all options from the root-level configuration. This is controlled by the `extends` option, which is enabled by default since Vitest 5.0").
8. For code that runs once before the workers exist, use `globalSetup`, because [lifecycle](../references/core/lifecycle.md "If you have configured [`globalSetup`](/config/globalsetup) files, they run once before any test workers are created.").
9. Pass serializable data from a global setup to tests with `provide` and `inject`, because [global-setup](../references/core/global-setup.md "However, you can pass down serializable data to tests via [`provide`](/config/provide) method and read them in your tests via `inject` imported from `vitest`").
10. For code that must run in the same process as the tests, use `setupFiles`, because [global-setup](../references/core/global-setup.md "If you need to execute code in the same process as tests, use [`setupFiles`](/config/setupfiles) instead, but note that it runs before every test file.").
11. You can select the coverage tool by setting `test.coverage.provider`, because [test-coverage](../references/infrastructure-ci-cd/test-coverage.md "You can select the coverage tool by setting `test.coverage.provider` to `v8` or `istanbul`:").
12. Turn coverage on with the `--coverage` flag or `coverage.enabled`, because [test-coverage](../references/infrastructure-ci-cd/test-coverage.md "To test with coverage enabled, you can pass the `--coverage` flag in CLI or set `coverage.enabled` in `vitest.config.ts`:").
13. To include uncovered files in the report, configure `coverage.include`, because [test-coverage](../references/infrastructure-ci-cd/test-coverage.md "To include uncovered files in the report, you'll need to configure [`coverage.include`](/config/coverage#coverage-include) with a pattern that will pick your source files:").
14. To exclude files that match `coverage.include`, define `coverage.exclude`, because [test-coverage](../references/infrastructure-ci-cd/test-coverage.md "To exclude files that are matching `coverage.include`, you can define an additional [`coverage.exclude`](/config/coverage#coverage-exclude):").
15. For a different output format, set `reporters` in the config or pass `--reporter`, because [reporting](../references/infrastructure-ci-cd/reporting.md "You can select different reporters either by using the `--reporter` command line option, or by including a `reporters` property in your [configuration file](/config/reporters).").
16. To keep the default reporters while adding one, extend `configDefaults.reporters`, because [reporting](../references/infrastructure-ci-cd/reporting.md "To add a reporter while keeping Vitest's defaults, extend `configDefaults.reporters`:").
17. To move a `json` or `junit` report, set `outputFile`, because [reporting](../references/infrastructure-ci-cd/reporting.md "The `json` and `junit` locations can be overridden with the `outputFile` [configuration option](/config/outputfile) in your Vitest configuration file or via CLI.").
18. When `reporters` is not configured, the `github-actions` reporter is added on GitHub Actions, because [reporting](../references/infrastructure-ci-cd/reporting.md "When `reporters` is not configured, Vitest uses the following reporters:") and [reporting](../references/infrastructure-ci-cd/reporting.md "is added when `process.env.GITHUB_ACTIONS === 'true'`").
19. To split a CI run across machines, use `--shard` with the blob reporter, because [github-actions](../references/infrastructure-ci-cd/github-actions.md "To split Vitest tests on multiple different runs, use [`--shard`](/guide/cli#shard) option with [`--reporter=blob`](/guide/reporters#blob-reporter) option:").
20. To run once without watch mode, use `vitest run`, because [cli](../references/infrastructure-ci-cd/cli.md "Perform a single run without watch mode.").
21. With `watchTriggerPatterns`, you declare a regex over file paths and a callback that returns which tests to rerun when a matching file changes, because [watch-mode](../references/infrastructure-ci-cd/watch-mode.md "You declare a regex over file paths and a callback that returns which tests to rerun when a matching file changes.")
22. To run tests affected by a Git baseline, use `--changed`, because [affected-tests](../references/infrastructure-ci-cd/affected-tests.md "[`--changed`](/config/changed) compares the working tree with a Git reference.").
23. To run tests affected since the last run, use `--since-last-run`, because [affected-tests](../references/infrastructure-ci-cd/affected-tests.md "[`--since-last-run`](/guide/cli#since-last-run) compares every file a test loaded with the time of the test's last run.").
24. Process: Change only the setting the request names. Leave unrelated config and tests untouched.

## Verify behavior and challenge findings

1. Process: Run the suite and read the output for the setting.
2. To run tests only inside a single project, use the `--project` CLI option, because [projects-dependencies](../references/core/projects-dependencies.md "If you need to run tests only inside a single project, use the `--project` CLI option:")
3. `vitest list` ignores the `reporters` option, so do not use it to check a reporter change, because [cli](../references/infrastructure-ci-cd/cli.md "`vitest list` command inherits all `vitest` options to print the list of all matching tests. This command ignores `reporters` option.")
4. Editing a setup file automatically triggers a rerun of all tests, because [global-setup](../references/core/global-setup.md "Editing a setup file will automatically trigger a rerun of all tests.")
5. Check the coverage report against `coverage.include` and `coverage.exclude`, because [test-coverage](../references/infrastructure-ci-cd/test-coverage.md "You can define what files are shown in coverage report by configuring [`coverage.include`](/config/coverage#coverage-include) and [`coverage.exclude`](/config/coverage#coverage-exclude).")
6. Process: Challenge the result. Run the same command on the original config. The output must differ in the way the request asked, or the change is not proven and the result is inconclusive.
7. Process: Run the whole suite and confirm that no test changed from passing to failing.

## Acceptance evidence

1. Process: The path of the config file Vitest loaded, and how that was determined.
2. Process: The command run and the part of its output that shows the setting in effect, on the original config and on the changed config.
3. Process: The full-suite run output on the changed config.
4. Process: The cited docs text that supports each setting changed.

## References

- [configuration.md](../references/core/configuration.md)
- [global-setup.md](../references/core/global-setup.md)
- [projects-dependencies.md](../references/core/projects-dependencies.md)
- [lifecycle.md](../references/core/lifecycle.md)
- [test-architecture.md](../references/architecture/test-architecture.md)
- [test-coverage.md](../references/infrastructure-ci-cd/test-coverage.md)
- [reporting.md](../references/infrastructure-ci-cd/reporting.md)
- [github-actions.md](../references/infrastructure-ci-cd/github-actions.md)
- [watch-mode.md](../references/infrastructure-ci-cd/watch-mode.md)
- [affected-tests.md](../references/infrastructure-ci-cd/affected-tests.md)
- [cli.md](../references/infrastructure-ci-cd/cli.md)
