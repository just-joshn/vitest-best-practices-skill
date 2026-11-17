# Fix a Failing Test

## When to use

- When a test fails on every run and should pass
- When a test fails alone and also fails in the full suite

## Investigate and establish evidence

1. Process: Record the failing test's file, name, and the failure output exactly as given, before running anything.
2. Read each part of the failure output, because [debugging](../references/debugging/debugging.md "There's a lot here, but each part tells you something:").
3. Read the diff for what is different between the two values, because [debugging](../references/debugging/debugging.md "The diff** shows exactly what's different.").
4. Run just the failing test, without the rest of the suite, because [debugging](../references/debugging/debugging.md "Run just that one test, without the rest of your suite:").
5. To focus on the first of many failures, use `--bail`, because [debugging](../references/debugging/debugging.md "If you have many failures and want to focus on the first one, use [`--bail`](/config/bail) to stop after a set number of failures:").
6. A test that passes alone but fails with others has a test isolation problem, because [debugging](../references/debugging/debugging.md "If the test passes when run alone but fails when run with others, you have a test isolation problem").
7. Process: If the test fails alone, go on. If it passes alone, follow the flaky test playbook for the isolation steps.
8. Read what a failure alone means, because [debugging](../references/debugging/debugging.md "If it fails even when run alone, the issue is in the test itself or the code it's testing.").
9. If tests carry tags, run only the tagged group with `--tags-filter`, because [test-tags](../references/core/test-tags.md "To run only tests with specific tags, use the [`--tags-filter`](/guide/cli#tagsfilter) CLI option:").
10. To see every test individually and not just files, use `--reporter=verbose`, because [debugging](../references/debugging/debugging.md "This shows every test individually (not just the files), which can help spot patterns in which tests pass and which fail.").
11. Check for a missing `await`, because [debugging](../references/debugging/debugging.md "The most common mistake is forgetting an `await`:").
12. Check for a test that hangs, because [debugging](../references/debugging/debugging.md "If a test hangs and eventually times out, it usually means a promise never resolves.").
13. Check for a stale snapshot, because [debugging](../references/debugging/debugging.md "If you're using [snapshot tests](/guide/learn/snapshots) and you intentionally changed the output of your code, the existing snapshots will be outdated.").
14. Check for browser APIs in the Node environment, because [debugging](../references/debugging/debugging.md "your test is running in the Node environment (the default).").
15. Check for a Promise that rejects with no `.catch()` handler or `await` attached, because [common-errors](../references/debugging/common-errors.md "This error happens when a Promise rejects but no `.catch()` handler or `await` is attached to it before the microtask queue flushes.").
16. For a module not found error, check that the path is correct, because [common-errors](../references/debugging/common-errors.md "You misspelled the path. Make sure the path is correct.").
17. For a module not found error, check for relative aliases, because [common-errors](../references/debugging/common-errors.md "Make sure you don't have relative [aliases](/config/alias). Vite treats them as relative to the file where the import is instead of the root.").
18. For a Browser Mode failure, read the step timeline under the error, because [traces](../references/browser-mode/traces.md "When a test fails, the error in the terminal is followed by a timeline of its recorded steps:").
19. For a Browser Mode failure, open the trace viewer for the page at the failure, because [traces](../references/browser-mode/traces.md "The trace viewer shows every step and the page when the test failed.").
20. To help understand why a change in one file causes failures in another, use the module graph in Vitest UI, because [debugging](../references/debugging/debugging.md "which can help you understand why a change in one file causes failures in another").
21. Read the module graph of the failing file, because [vitest-ui](../references/debugging/vitest-ui.md "Module Graph's tab displays the module graph of the selected test file.").
22. To inspect values, add `console.log`, because [debugging](../references/debugging/debugging.md "There's nothing wrong with adding `console.log` to your tests. It's the fastest way to inspect values and understand what's happening:").
23. To step through code line by line, run with `--inspect-brk` and attach a debugger, because [debugging](../references/debugging/debugging.md "you can run Vitest with the `--inspect-brk` flag and attach a debugger").
24. To debug from an editor, use the VS Code extension, because [debugging](../references/debugging/debugging.md "lets you run and debug individual tests directly from your editor.").
25. To run tests as you type, use Wallaby.js, because [ide](../references/core/ide.md "[Wallaby.js](https://wallabyjs.com) runs your Vitest tests immediately as you type").
26. Process: Name the single cause the evidence supports before changing code. If the evidence supports no cause, the result is inconclusive.

## Design and implement

1. Decide whether the code changed on purpose or the test is wrong by reading the code under test, because [debugging](../references/debugging/debugging.md "Check the source code for `createUser` to find out.").
2. Process: Write down the behavior the test is meant to protect and what its users observe, then judge the test and the code against it.
3. If the behavior change was intended, update the test, because [debugging](../references/debugging/debugging.md "If the default was intentionally changed, update the test. If not, you've found a bug.").
4. If it was not intended, treat it as a bug in the code under test, because [debugging](../references/debugging/debugging.md "If not, you've found a bug.").
5. For a stale snapshot, review the diff before updating, because [debugging](../references/debugging/debugging.md "Review the diff to confirm the changes are correct, then update the snapshots by pressing `u` in watch mode or running `vitest -u`.").
6. For a missing `await`, add it, because [debugging](../references/debugging/debugging.md "Vitest will usually warn you about unawaited assertions at the end of the test. If you see that warning, add the missing `await`:").
7. For an unhandled rejection that the test expects, assert it with `rejects`, because [common-errors](../references/debugging/common-errors.md "If you expect the call to throw, use [`expect().rejects`](/api/expect#rejects):").
8. When the wait condition is an assertion, wait with `expect.poll`, because [assertions-waiting](../references/core/assertions-waiting.md "Use [`expect.poll`](/api/expect#poll) when the wait condition is an assertion.").
9. For a callback whose thrown error should queue another attempt, wait with `vi.waitFor`, because [assertions-waiting](../references/core/assertions-waiting.md "It runs the callback at each interval; a thrown error queues another attempt, and the first call that doesn't throw resolves the wait with whatever the callback returned.").
10. For browser APIs in the Node environment, set `environment` or use Browser Mode, because [debugging](../references/debugging/debugging.md "You can switch to a browser-like environment with the [`environment`](/config/environment) config option, or better yet, use [Browser Mode](/guide/browser/) which runs tests in a real browser.").
11. Process: Change only what the decision requires. Leave unrelated tests and config untouched.

## Verify behavior and challenge findings

1. Process: Run the failing test alone on the original code and record that it fails with the original error.
2. Run the test again after the fix and record that it passes, because [test-suite-structure](../references/core/test-suite-structure.md "Run the test again. It passes.").
3. Run once without watch mode with `vitest run`, because [cli](../references/infrastructure-ci-cd/cli.md "Perform a single run without watch mode.").
4. Process: Confirm that no other test changed from passing to failing.
5. Process: Challenge the decision. If only the test changed, check that the test would still fail if the behavior it protects broke.

## Acceptance evidence

1. Process: The command for the failing test, with its output on the original code and on the changed code.
2. Process: The full-suite run output on the changed code.
3. Process: The named cause, whether the test or the code was wrong, and the cited docs text that supports the change.

## References

- [debugging.md](../references/debugging/debugging.md)
- [common-errors.md](../references/debugging/common-errors.md)
- [vitest-ui.md](../references/debugging/vitest-ui.md)
- [ide.md](../references/core/ide.md)
- [traces.md](../references/browser-mode/traces.md)
- [cli.md](../references/infrastructure-ci-cd/cli.md)
- [test-tags.md](../references/core/test-tags.md)
- [test-suite-structure.md](../references/core/test-suite-structure.md)
- [assertions-waiting.md](../references/core/assertions-waiting.md)
