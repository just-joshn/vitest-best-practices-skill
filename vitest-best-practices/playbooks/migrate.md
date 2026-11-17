# Migrate to Vitest

## When to use

- When a project's tests run on Jest and should run on Vitest
- When a project's tests run on Mocha, Chai, or Sinon and should run on Vitest
- When a project runs an older Vitest and should move to the current major version

## Investigate and establish evidence

1. Process: Record the current runner, its installed version, and the command that runs the whole suite.
2. Process: Delegate the baseline run and each batch run to a subagent. Compare the results yourself.
3. Process: Run the whole suite on the current runner before changing anything. Save each test's file, full name, and status (passed, failed, skipped) to a file.
4. Process: Record the Node.js version and the installed Vite version.
5. For an older Vitest, check the Node.js and Vite versions first, because [migrating-vitest](../references/migration/migrating-vitest.md "Before proceeding with any other migration steps, ensure your environment meets these requirements.").
6. For a Vitest lower than 4, apply earlier migration guides first, because [migrating-vitest](../references/migration/migrating-vitest.md "If the current version is lower than Vitest 4, apply changes from earlier migration guides first.").
7. Vitest's JSON reporter generates a report of the test results, because [reporting](../references/infrastructure-ci-cd/reporting.md "Generates a report of the test results in a JSON format compatible with Jest's `--json` option.").
8. For Vitest, run the suite once without watch mode, because [cli](../references/infrastructure-ci-cd/cli.md "Perform a single run without watch mode.").
9. For Jest, find tests that rely on globals, because [jest](../references/migration/jest.md "Jest has their [globals API](https://jestjs.io/docs/api) enabled by default. Vitest does not.").
10. For Jest, find uses of the `jest` namespace, because [jest](../references/migration/jest.md "Vitest doesn't have an equivalent to `jest` namespace, so you will need to import types directly from `vitest`:").
11. For Jest, find `requireActual` calls, because [jest](../references/migration/jest.md "In Vitest, you should replace these calls with `vi.importActual`.").
12. For Jest, find `done` callbacks, because [jest](../references/migration/jest.md "Vitest does not support the callback style of declaring tests.").
13. For Jest, find `jest.setTimeout` calls, because [jest](../references/migration/jest.md "If you used `jest.setTimeout`, you would need to migrate to `vi.setConfig`:").
14. For Jest, find `jest.mock` factories, because [jest](../references/migration/jest.md "In Vitest, the factory argument has to return an object with each export explicitly defined.").
15. For Mocha, find where tests rely on globals, because [mocha](../references/migration/mocha.md "**Globals**: Mocha provides globals by default.").
16. For Mocha, find Sinon spies, stubs, and mocks, because [mocha](../references/migration/mocha.md "Replace Sinon's spy/stub/mock creation with Vitest's `vi` utilities:").
17. Process: List which documented differences apply to this project, and which do not, before changing code.

## Design and implement

1. Process: Migrate one batch at a time, for example one directory of test files, and run that batch before starting the next.
2. For Jest, enable globals or import from `vitest`, because [jest](../references/migration/jest.md "You can either enable globals via [the `globals` configuration setting](/config/globals) or update your code to use imports from the `vitest` module instead.").
3. For Jest, if globals stay off, common libraries like testing-library will not run auto DOM cleanup, because [jest](../references/migration/jest.md "If you decide to keep globals disabled, be aware that common libraries like [`testing-library`](https://testing-library.com/) will not run auto DOM [cleanup]").
4. For Jest module mocks, return an object with each export defined, because [jest](../references/migration/jest.md "In Vitest, the factory argument has to return an object with each export explicitly defined.").
5. For Jest `requireActual`, use `vi.importActual`, because [jest](../references/migration/jest.md "In Vitest, you should replace these calls with `vi.importActual`.").
6. To have modules mocked in every test, like in Jest, mock them inside `setupFiles`, because [jest](../references/migration/jest.md "If you need them to be mocked in every test, like in Jest, you can mock them inside [`setupFiles`](/config/setupfiles).").
7. Vitest `mockReset` resets the mock implementation to its original, because [jest](../references/migration/jest.md "Vitest's [`mockReset`](/api/mock#mockreset) resets the mock implementation to its original.").
8. For Jest `done` callbacks, rewrite them, because [jest](../references/migration/jest.md "Vitest does not support the callback style of declaring tests.").
9. For `beforeAll` and `beforeEach` hooks that return something other than `undefined` or `null`, you may need to rewrite the hook declarations, because [jest](../references/migration/jest.md "Because of that you may need to rewrite your hooks declarations, if they return something other than `undefined` or `null`:").
10. For tests that need Jest hook order, update `sequence.hooks`, because [jest](../references/migration/jest.md "To use Jest's behavior, update [`sequence.hooks`](/config/sequence#sequence-hooks) option:").
11. For `jest.setTimeout`, use `vi.setConfig`, because [jest](../references/migration/jest.md "If you used `jest.setTimeout`, you would need to migrate to `vi.setConfig`:").
12. Find tests that use Jest legacy timers, because [jest](../references/migration/jest.md "Vitest doesn't support Jest's legacy timers.").
13. For `-t` patterns or test names that span a suite and a test, update them, because [jest](../references/migration/jest.md "Vitest matches against the `>`-joined full name, while Jest matches the space-joined name.").
14. For code that reads `JEST_WORKER_ID`, rename it, because [jest](../references/migration/jest.md "Vitest also has a counterpart for `JEST_WORKER_ID` called `VITEST_POOL_ID`").
15. For Mocha with Chai, keep the Chai assertions, because [mocha](../references/migration/mocha.md "Vitest includes Chai assertions by default, so Chai assertions work without changes:").
16. For Sinon assertions, keep the Chai-style assertions, because [mocha](../references/migration/mocha.md "Vitest provides **Chai-style assertions** for spies and mocks, allowing you to migrate from Sinon without rewriting assertions:").
17. Replace Sinon spy, stub, and mock creation with Vitest `vi` utilities, because [mocha](../references/migration/mocha.md "Replace Sinon's spy/stub/mock creation with Vitest's `vi` utilities:").
18. For Mocha tests that depend on running one after another, check them, because [mocha](../references/migration/mocha.md "Vitest runs tests in parallel by default, Mocha runs sequentially").
19. For an older Vitest, `clearMocks` now defaults to `true`, so Vitest calls `vi.clearAllMocks()` before every test, because [migrating-vitest](../references/migration/migrating-vitest.md "now defaults to `true`: Vitest calls [`vi.clearAllMocks()`](/api/vi#vi-clearallmocks) before every test, clearing the recorded history of every mock while leaving implementations intact.").
20. For an older Vitest, move `vi.mock`, `vi.unmock`, and `vi.hoisted` calls to the top level, because [migrating-vitest](../references/migration/migrating-vitest.md "Calling them inside a function, block, or `describe`/`test` callback previously only logged a warning. Vitest 5.0 now throws").
21. For an older Vitest, add `await` to asynchronous assertions, because [migrating-vitest](../references/migration/migrating-vitest.md "Asynchronous assertions, like `resolves`, `rejects` and `toMatchFileSnapshot`, now fail the test if they are not awaited.").
22. For an older Vitest, raise the `timeout` of a poll that needs more time, because [migrating-vitest](../references/migration/migrating-vitest.md "A poll that legitimately needs more time should raise its `timeout`.").
23. For an older Vitest run from a subdirectory with a parent config file, pass the config explicitly, because [migrating-vitest](../references/migration/migrating-vitest.md "If you previously relied on running `vitest` from a subdirectory while using a config file from a parent directory, pass the config explicitly").
24. Process: Change only what a documented difference requires. Leave unrelated tests and config untouched.
25. Process: Reject migrating the whole suite in one batch, and reject skipping or deleting a test that changed status to get a passing run.

## Verify behavior and challenge findings

1. Process: Run the whole suite on Vitest after each batch and save each test's file, full name, and status in the same format as the baseline.
2. Process: Compare the baseline and the new results test by test. Count tests that are missing, added, or renamed.
3. Process: Treat every test whose status changed, including passed to skipped, as unresolved until a documented difference or a named cause explains it.
4. For renamed tests, check whether the name join explains the difference, because [jest](../references/migration/jest.md "Vitest's `test` names are joined with a `>` symbol to make it easier to distinguish tests from suites, while Jest uses an empty space").
5. Process: Challenge each explanation. Revert the related change and confirm the status changes back.

## Acceptance evidence

1. Process: The baseline run, with its command, runner version, and per-test statuses.
2. Process: The final Vitest run, with its command, version, and per-test statuses.
3. Process: The comparison, with a count of tests that kept status and a list of every test that changed status.
4. Process: For each changed test, the documented difference that explains it, or the word unresolved.

## References

- [migrating-vitest.md](../references/migration/migrating-vitest.md)
- [jest.md](../references/migration/jest.md)
- [mocha.md](../references/migration/mocha.md)
- [reporting.md](../references/infrastructure-ci-cd/reporting.md)
- [cli.md](../references/infrastructure-ci-cd/cli.md)
