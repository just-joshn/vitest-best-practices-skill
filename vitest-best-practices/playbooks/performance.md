# Improve Test Performance

## When to use

- When the whole suite takes too long to run
- When a single test or test file is slow
- When a run is slow in CI or on a machine with many CPUs

## Investigate and establish evidence

1. Process: Record the slow command, the machine, and the wall-clock time of a run, before changing anything.
2. Process: Delegate the baseline and after measurements to a subagent on the same machine. Compare the numbers yourself.
3. Read the `Duration` line of the run summary, because [performance](../references/infrastructure-ci-cd/performance.md "The `Duration` line of the summary breaks the run down into phases, as percentages of all tracked time:").
4. Treat the percentages as shares of tracked time, not wall-clock time, because [performance](../references/infrastructure-ci-cd/performance.md "The percentages are relative to the sum of all tracked phases, not to the wall-clock time").
5. In a multi-project setup, read the percentages as aggregated over all projects, because [performance](../references/infrastructure-ci-cd/performance.md "In a multi-project setup the percentages aggregate over all [projects](/guide/projects)").
6. If Vitest prints a hint after the summary, read it, because [performance](../references/infrastructure-ci-cd/performance.md "When the collected timings show that a configuration change would make the run significantly faster, Vitest also prints a hint after the summary").
7. Run `vitest doctor` to measure alternative configurations, because [cli](../references/infrastructure-ci-cd/cli.md "`vitest doctor` measures how much faster the test suite would run under alternative configurations by running it under each of them.").
8. If the `tests` phase dominates, expect little gain from configuration, because [performance](../references/infrastructure-ci-cd/performance.md "A run dominated by this phase has little to gain from configuration changes.").
9. When test execution time is high, you can generate a profile of the test runner, because [performance](../references/infrastructure-ci-cd/performance.md "In cases where your test execution time is high, you can generate a profile of the test runner.")
10. Profiling the main thread is useful for debugging Vitest's Vite usage and `globalSetup` files, because [performance](../references/infrastructure-ci-cd/performance.md "Profiling main thread is useful for debugging Vitest's Vite usage and [`globalSetup`](/config/globalsetup) files.")
11. Process: Name the single bottleneck the measurement supports before changing code. If the measurement supports none, the result is inconclusive.

## Design and implement

1. DOM environments are expensive to create, and with an isolating pool that cost is paid for every test file, because [performance](../references/infrastructure-ci-cd/performance.md "DOM environments are expensive to create: `jsdom` costs roughly 200-500ms per import and `happy-dom` roughly 90-200ms, plus the time to construct the window. With an isolating pool (the default), that cost is paid for every test file, because every file gets a fresh worker.")
2. Isolating every test file greatly increases test times, which might not be desirable for projects that do not rely on side effects and properly clean up their state, because [performance](../references/infrastructure-ci-cd/performance.md "This greatly increases test times, which might not be desirable for projects that don't rely on side effects and properly cleanup their state")
3. Disable isolation for only some files with `projects`, because [performance](../references/infrastructure-ci-cd/performance.md "You can also disable isolation for specific files only by using `projects`:").
4. With `fsModuleCache`, Vitest persists its cache of transformed files to the file system so it can be reused across reruns, because [performance](../references/infrastructure-ci-cd/performance.md "With [`fsModuleCache`](/config/fsmodulecache) (enabled by default), Vitest persists this cache to the file system so it can be reused across reruns.")
5. If the root directory has unrelated folders and files, limiting the search with `test.dir` should make it faster, because [performance](../references/infrastructure-ci-cd/performance.md "This should make the search faster if you have unrelated folders and files in the root directory.")
6. You can try to improve test run time by switching the `pool` option, because [performance](../references/infrastructure-ci-cd/performance.md "You can try to improve test run time by switching `pool` option in configuration:").
7. You can control how many workers run simultaneously with `maxWorkers`, because [parallel-sharding](../references/infrastructure-ci-cd/parallel-sharding.md "You can control how many workers run simultaneously with the [`maxWorkers`](/config/maxworkers) option.")
8. For most projects, file parallelism is the single biggest factor in test suite speed. One case where you might want to disable it is when tests share an external resource like a database that can't handle concurrent access, because [parallel-sharding](../references/infrastructure-ci-cd/parallel-sharding.md "For most projects, file parallelism is the single biggest factor in test suite speed. However, there are cases where you might want to disable it — for example, if your tests share an external resource like a database that can't handle concurrent access.")
9. Sharding can be useful when the suite is large and several machines can run subsets of it simultaneously, because [parallel-sharding](../references/infrastructure-ci-cd/parallel-sharding.md "This can be useful when you have a large test suite and multiple machines that could run subsets of that suite simultaneously.").
10. Merge the shard results with `--merge-reports`, because [parallel-sharding](../references/infrastructure-ci-cd/parallel-sharding.md "Collect the results stored in `.vitest/blob/` directory from each machine and merge them with [`--merge-reports`](/guide/cli#merge-reports) option:").
11. Test sharding can also become useful on high CPU-count machines, because [parallel-sharding](../references/infrastructure-ci-cd/parallel-sharding.md "Test sharding can also become useful on high CPU-count machines.")
12. If you edited one module, only the tests that load that module can change their result, because [affected-tests](../references/infrastructure-ci-cd/affected-tests.md "If you edited one module, only the tests that load that module can change their result.")
13. Select affected tests with `--changed` for a Git baseline, because [affected-tests](../references/infrastructure-ci-cd/affected-tests.md "[`--changed`](/config/changed) compares the working tree with a Git reference.").
14. Select affected tests with `--since-last-run` for a baseline of your own last run, because [affected-tests](../references/infrastructure-ci-cd/affected-tests.md "[`--since-last-run`](/guide/cli#since-last-run) compares every file a test loaded with the time of the test's last run.").
15. Process: Change one setting at a time and leave unrelated tests and config untouched.
16. Process: Reject a setting change the measurement did not point to, and do not keep a change that fails to improve the same measurement.

## Verify behavior and challenge findings

1. Process: Re-run the same command on the same machine and compare the wall-clock time with the baseline.
2. `vitest doctor` picks its candidates based on the current config, because [cli](../references/infrastructure-ci-cd/cli.md "`vitest doctor` measures how much faster the test suite would run under alternative configurations by running it under each of them. The candidates are picked based on the current config:")
3. If isolation was disabled, run the suite twice with shuffling, because [performance](../references/infrastructure-ci-cd/performance.md "Run the suite twice with shuffling to surface inter-file pollution:").
4. For a single run without watch mode, use `vitest run`, because [cli](../references/infrastructure-ci-cd/cli.md "Perform a single run without watch mode.")
5. If `--since-last-run` was used, finish with a full run, because [affected-tests](../references/infrastructure-ci-cd/affected-tests.md "Two things the records cannot see: a file that no test loaded during the last run (a new `.env` file, a new `__mocks__` file), and modification times set in the past by a checkout or an unpacked archive. The full run at the end covers both.")
6. Process: Challenge the result. Repeat the baseline measurement on the original code. If it does not show the original slowness, the result is inconclusive.
7. Process: Confirm that no test changed from passing to failing.

## Acceptance evidence

1. Process: The command, the machine, and the Duration line before and after the change.
2. Process: The named bottleneck and the cited docs text that supports the change.
3. Process: The full-suite run output on the changed code, showing the same tests pass.

## References

- [performance.md](../references/infrastructure-ci-cd/performance.md)
- [parallel-sharding.md](../references/infrastructure-ci-cd/parallel-sharding.md)
- [affected-tests.md](../references/infrastructure-ci-cd/affected-tests.md)
- [cli.md](../references/infrastructure-ci-cd/cli.md)
