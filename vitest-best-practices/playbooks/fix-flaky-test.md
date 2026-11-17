# Fix a Flaky Test

## When to use

- When a test passes on some runs and fails on others
- When a test passes alone but fails when the full suite runs

## Investigate and establish evidence

1. Process: Record the failing test's file, name, and the failure output exactly as given, before running anything.
2. Reproduce the instability with `--repeats=<number>`, because [flaky-tests](../references/debugging/flaky-tests.md "This is useful for verifying that tests are stable across multiple runs. If a test fails on any repetition, the whole test is reported as failed.").
3. Run just that one test without the rest of the suite, because [debugging](../references/debugging/debugging.md "Run just that one test, without the rest of your suite:").
4. Compare the alone run with the full-suite run, because [debugging](../references/debugging/debugging.md "If the test passes when run alone but fails when run with others, you have a test isolation problem (more on that below).").
5. Look for state that tests share and do not reset, because [debugging](../references/debugging/debugging.md "The usual cause is that some other test modifies shared state (a global variable, a module-level cache, a database) and doesn't clean up after itself.").
6. Look for a missing `await` on a promise assertion, because [debugging](../references/debugging/debugging.md "The most common mistake is forgetting an `await`:").
7. Look for spies or mocks that are not restored, because [debugging](../references/debugging/debugging.md "If a mock from one test leaks into another, you'll get unexpected behavior.").
8. Look for fixed-length waits, because [assertions-waiting](../references/core/assertions-waiting.md "Waiting with `setTimeout` tends to land on either a flaky undershoot or a wasteful long sleep").
9. Look for test files that share an exclusive resource, because [flaky-tests](../references/debugging/flaky-tests.md "The exception is the handful that share an exclusive resource, like a fixed port, a writable temp directory, or a database without per-test isolation.").
10. In Browser Mode screenshot tests, look for animations, because [flaky-tests](../references/debugging/flaky-tests.md "Animations can cause flaky tests. Disable them during testing").
11. Process: Name the single cause the evidence supports before changing code. If the evidence supports no cause, the result is inconclusive.

## Design and implement

1. For shared state, reset it per test, because [debugging](../references/debugging/debugging.md "The fix is to reset the state before each test with").
2. For shared state, `test.extend` can create fresh state for each test automatically, which the docs call better yet than resetting with `beforeEach`, because [debugging](../references/debugging/debugging.md "or better yet, use [`test.extend`](/guide/test-context#extend-test-context) to create fresh state for each test automatically").
3. For a missing `await`, add it, because [debugging](../references/debugging/debugging.md "If you see that warning, add the missing `await`:").
4. For leaked mocks, the docs call enabling automatic mock restoration in the config the easiest fix, because [debugging](../references/debugging/debugging.md "The easiest fix is to enable automatic mock restoration in your config").
5. For a fixed wait on an assertion, use `expect.poll`, because [assertions-waiting](../references/core/assertions-waiting.md "when the wait condition is an assertion").
6. When the wait condition is the work itself succeeding rather than an assertion, `vi.waitFor` runs the callback at each interval and a thrown error queues another attempt, because [assertions-waiting](../references/core/assertions-waiting.md "[`vi.waitFor`](/api/vi#vi-waitfor) is the right tool when the wait condition is the work itself succeeding rather than an assertion you write. It runs the callback at each interval; a thrown error queues another attempt").
7. For date dependence, control the date, because [clock-mocking](../references/mocking/clock-mocking.md "Sometimes you need to be in control of the date to ensure consistency when testing.").
8. For files that share an exclusive resource, split them into a sequential project, because [parallel-sharding](../references/infrastructure-ci-cd/parallel-sharding.md "Splitting the suite into two [`projects`](/guide/projects), one parallel and one sequential, lets only the affected files pay the cost.").
9. Process: Use retries only when the goal or constraints ask for them. If retries are added, report that they were added and why.
10. If retries are requested, use the `retry` option, which retries the test a specific number of times if it fails, because [flaky-tests](../references/debugging/flaky-tests.md "Retry the test specific number of times if it fails.").
11. If skipping is requested, skip rather than delete, because [flaky-tests](../references/debugging/flaky-tests.md "It lets you keep the test in place as a reminder while unblocking the rest of the suite.").
12. Process: Change only what the named cause requires. Leave unrelated tests and config untouched.

## Verify behavior and challenge findings

1. Re-run the repeated check on the changed code, because [flaky-tests](../references/debugging/flaky-tests.md "If a test fails on any repetition, the whole test is reported as failed.").
2. Run the whole suite once with `vitest run`, because [cli](../references/infrastructure-ci-cd/cli.md "Perform a single run without watch mode.").
3. Process: Challenge the cause. Run the same repeated check on the original code. If the original never failed, the cause is not proven and the result is inconclusive.
4. Process: Confirm that no other test changed from passing to failing.

## Acceptance evidence

1. Process: The repeat command, with its failure count on the original code and on the changed code.
2. Process: The full-suite run output on the changed code.
3. Process: The named cause and the cited docs text that supports the change.

## References

- [flaky-tests.md](../references/debugging/flaky-tests.md)
- [debugging.md](../references/debugging/debugging.md)
- [assertions-waiting.md](../references/core/assertions-waiting.md)
- [clock-mocking.md](../references/mocking/clock-mocking.md)
- [parallel-sharding.md](../references/infrastructure-ci-cd/parallel-sharding.md)
- [cli.md](../references/infrastructure-ci-cd/cli.md)
