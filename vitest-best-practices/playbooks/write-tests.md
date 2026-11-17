# Write Tests

## When to use

- When a behavior has no tests yet
- When existing tests for a behavior assert too little or only check implementation details
- When a bug needs a test that reproduces it

## Investigate and establish evidence

1. Process: Restate the behavior to test and the acceptance checks in one line each, before reading code.
2. Process: Delegate reading the existing tests and config near the code under test to a read-only subagent. Keep the test design yourself.
3. Define the behavior by its contract, because [test-suite-structure](../references/core/test-suite-structure.md "start by thinking about its **contract**: what does it promise to do for the code that calls it?").
4. Read the `include` and `exclude` config options for which files are included, because [test-suite-structure](../references/core/test-suite-structure.md "you can customize which files are included with the [`include`](/config/include) and [`exclude`](/config/exclude) config options.").
5. Some teams use a separate `__tests__` or `test` directory, and either layout works, because [test-suite-structure](../references/core/test-suite-structure.md "Some teams prefer a separate `__tests__` or `test` directory instead. Either approach works.").
6. If an AI writes the tests, share existing test files from the same project, because [writing-tests-with-ai](../references/core/writing-tests-with-ai.md "Share existing test files from the same project. This helps the AI match your conventions").
7. Check whether the config enables the `globals` option, because [test-suite-structure](../references/core/test-suite-structure.md "you can enable the [`globals`](/config/globals) option in your config").
8. Look in setup files for things like extending the `expect` API or global polyfills, because [fixtures-hooks](../references/core/fixtures-hooks.md "This makes them the right place for things like extending the `expect` API or configuring global polyfills.").
9. Check whether the project already defines fixtures with `test.extend`, because [fixtures-hooks](../references/core/fixtures-hooks.md "The `test.extend` method lets you create a custom test API with fixtures").
10. Check whether the config defines tags, because [test-tags](../references/core/test-tags.md "Tags must be defined in your configuration file.").
11. Check whether the project already has type tests, because [type-testing](../references/testing-patterns/type-testing.md "By default all tests inside `*.test-d.ts` files are considered type tests").
12. Check whether the project already has in-source tests, because [in-source-testing](../references/testing-patterns/in-source-testing.md "put a `if (import.meta.vitest)` block at the end of your source file").
13. Check which files are benchmark files by their file names, because [benchmarking](../references/testing-patterns/benchmarking.md "Whether a file participates in the benchmark run is decided by the filename").
14. Process: Write down the project's conventions you found: file layout, naming, imports, fixtures, tags. The new tests follow them.

## Design and implement

1. Name each test for the behavior, because [test-suite-structure](../references/core/test-suite-structure.md "Write test names that describe the behavior, not the implementation.").
2. Keep each test on one behavior, because [test-suite-structure](../references/core/test-suite-structure.md "The important thing is keeping each test focused on one behavior.").
3. Assert on outputs, because a test that breaks when internals are refactored and the output stays the same is probably testing implementation details: [test-suite-structure](../references/core/test-suite-structure.md "if someone refactors the internals but the output stays the same, should the test break? If it would, you're probably testing implementation details rather than behavior.").
4. When reviewing AI-generated tests, watch for tests that only check that a function does not throw, or that assert on the mock itself rather than the behavior, because [writing-tests-with-ai](../references/core/writing-tests-with-ai.md "Watch for tests that call a function but only check that it doesn't throw, or tests that assert on the mock itself rather than the behavior.").
5. Cover the main behavior, then the boundaries, because [test-suite-structure](../references/core/test-suite-structure.md "After covering the main behavior, think about the boundaries.").
6. Pick the most precise matcher, because [assertions-waiting](../references/core/assertions-waiting.md "You should pick the matcher that most precisely describes what you're checking.").
7. Choose between equality matchers by what is compared, because [assertions-waiting](../references/core/assertions-waiting.md "use `toBe` for primitives (numbers, strings, booleans), `toEqual` for comparing structure").
8. For errors, wrap the call in a function, because [assertions-waiting](../references/core/assertions-waiting.md "You need to wrap the call in another function so that Vitest can catch the error instead of letting it crash the test").
9. For async code, make the test function async, because [assertions-waiting](../references/core/assertions-waiting.md "Vitest will automatically wait for the returned promise to resolve before considering the test complete.").
10. Await promise assertions, because [assertions-waiting](../references/core/assertions-waiting.md "Don't forget the `await` before `expect`.").
11. When the wait condition is an assertion, use `expect.poll`, because [assertions-waiting](../references/core/assertions-waiting.md "Use [`expect.poll`](/api/expect#poll) when the wait condition is an assertion.").
12. For assertions inside callbacks, call `expect.hasAssertions`, because [assertions-waiting](../references/core/assertions-waiting.md "guards against this by verifying that at least one assertion ran during the test").
13. For several cases that differ only in input and expected output, use `test.for`, because [test-suite-structure](../references/core/test-suite-structure.md "lets you define the cases as data and run the same test logic for all of them").
14. When a module exports multiple functions, use `describe` blocks to group the tests for each one, because [test-suite-structure](../references/core/test-suite-structure.md "When a module exports multiple functions, use `describe` blocks to group the tests for each one.").
15. Keep `describe` nesting shallow, because [test-suite-structure](../references/core/test-suite-structure.md "Avoid nesting `describe` blocks more than one or two levels deep.").
16. Creating a fresh instance in every test, as the docs do with `createTodoList()`, keeps tests independent so they can run in any order, because [test-suite-structure](../references/core/test-suite-structure.md "Notice that we create a fresh `createTodoList()` in every test. This keeps tests independent, which means they can run in any order without affecting each other.").
17. For repeated setup, use `beforeEach`, because [fixtures-hooks](../references/core/fixtures-hooks.md "`beforeEach` runs before every test in the file, and `afterEach` runs after every test, even if the test fails.").
18. For setup that needs cleanup, use fixtures from `test.extend`, because [fixtures-hooks](../references/core/fixtures-hooks.md "You define reusable **fixtures** that are automatically created for each test and cleaned up afterwards").
19. For a resource created inside one test, clean it up with `onTestFinished`, because [fixtures-hooks](../references/core/fixtures-hooks.md "lets you register a cleanup function right where you create the resource").
20. For integration tests that touch a real database and need a clean state, wrap each test in a transaction that is rolled back, because [database-testing](../references/testing-patterns/database-testing.md "wrap each test in a transaction that's rolled back when it finishes").
21. For work that must stop when a test is cancelled, pass the test's signal, because [cancellable-resources](../references/testing-patterns/cancellable-resources.md "Pass it to anything that accepts an `AbortSignal` and the resource is released when Vitest cancels.").
22. Do not mock the code under test, because [test-suite-structure](../references/core/test-suite-structure.md "Don't mock the thing you're testing.").
23. Reach for mocks only when the real thing is slow, flaky, or has side effects the test cannot control, because [test-suite-structure](../references/core/test-suite-structure.md "Only reach for mocks when the real thing is slow, flaky, or has side effects you can't control in a test.").
24. Make date, random, and UUID dependence predictable, because [test-suite-structure](../references/core/test-suite-structure.md "If your code depends on the current date, a random number, or a UUID generator, mock those to make your tests predictable.").
25. Use a snapshot when you want to protect against any change in the output, and use targeted assertions when you only care about specific properties, because [snapshot-testing](../references/testing-patterns/snapshot-testing.md "use snapshots when you want to protect against _any_ change in the output, and use targeted assertions when you only care about _specific_ properties.").
26. For volatile fields in a snapshot, pin the structure, because [snapshot-testing](../references/testing-patterns/snapshot-testing.md "you can use property matchers to pin the structure while ignoring volatile fields").
27. Commit snapshot files to version control, because [snapshot-testing](../references/testing-patterns/snapshot-testing.md "Commit your snapshot files to version control.").
28. To add a custom matcher, call `expect.extend` with an object containing your matchers, because [custom-matchers](../references/testing-patterns/custom-matchers.md "To extend default matchers, call `expect.extend` with an object containing your matchers.").
29. For types, use `expectTypeOf` or `assertType`, because [type-testing](../references/testing-patterns/type-testing.md "Vitest allows you to write tests for your types, using `expectTypeOf` or `assertType` syntaxes.").
30. To stub tests to be implemented later, use `test.todo`, because [annotations](../references/core/annotations.md "Use `test.todo` to stub tests to be implemented later.").
31. If tests are AI-written, state the function, the scenarios, and the behavior to verify in the prompt, because [writing-tests-with-ai](../references/core/writing-tests-with-ai.md "This tells the AI exactly which function to focus on, which scenarios matter, and what behavior to verify.").
32. Process: Change only the test files, and any config the new tests strictly need. Leave production code untouched.

## Verify behavior and challenge findings

1. Run the new test file, because [writing-tests-with-ai](../references/core/writing-tests-with-ai.md "Always run the tests before committing.").
2. Run it once without watch mode, because [getting-started](../references/core/getting-started.md "To run tests once without watching for file changes, use `vitest run`.").
3. For a bug, run the new test before the fix and confirm it fails, because [test-suite-structure](../references/core/test-suite-structure.md "A better approach is to write a failing test first that reproduces the bug").
4. After the fix, run the test again and confirm it passes, because [test-suite-structure](../references/core/test-suite-structure.md "Run the test again. It passes.").
5. For snapshot tests, a changed output fails the test, because [snapshot-testing](../references/testing-patterns/snapshot-testing.md "On subsequent runs, the output is compared against the saved snapshot. If the output changes, the test fails.").
6. For type tests, run with the typecheck flag, because [expect-typeof](../references/api/expect-typeof.md "To [enable typechecking](/guide/testing-types#run-typechecking), don't forget to pass down `--typecheck` flag.").
7. Process: Run the whole suite once and confirm no other test changed from passing to failing.

## Acceptance evidence

1. Process: The new tests' output on the correct behavior, all passing.
2. Process: The new test's failing output before the fix, when the test is for a bug.
3. Process: The conventions found in Investigation and where the new tests follow them.
4. Process: The full-suite run output.

## References

- [getting-started.md](../references/core/getting-started.md)
- [test-suite-structure.md](../references/core/test-suite-structure.md)
- [fixtures-hooks.md](../references/core/fixtures-hooks.md)
- [assertions-waiting.md](../references/core/assertions-waiting.md)
- [annotations.md](../references/core/annotations.md)
- [test-tags.md](../references/core/test-tags.md)
- [writing-tests-with-ai.md](../references/core/writing-tests-with-ai.md)
- [snapshot-testing.md](../references/testing-patterns/snapshot-testing.md)
- [custom-matchers.md](../references/testing-patterns/custom-matchers.md)
- [type-testing.md](../references/testing-patterns/type-testing.md)
- [in-source-testing.md](../references/testing-patterns/in-source-testing.md)
- [benchmarking.md](../references/testing-patterns/benchmarking.md)
- [database-testing.md](../references/testing-patterns/database-testing.md)
- [cancellable-resources.md](../references/testing-patterns/cancellable-resources.md)
- [test.md](../references/api/test.md)
- [describe.md](../references/api/describe.md)
- [hooks.md](../references/api/hooks.md)
- [expect.md](../references/api/expect.md)
- [expect-typeof.md](../references/api/expect-typeof.md)
