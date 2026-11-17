# Mocking

## When to use

- When a test needs a dependency replaced with a fake version
- When a test needs to observe calls to a dependency
- When a test depends on the current date, timers, a global, the file system, or the network

## Investigate and establish evidence

1. Process: Record the test file, the dependency in question, and what the test must assert about it.
2. Process: Delegate the search for every place the dependency is imported or called to a read-only subagent.
3. Decide first whether to mock at all, because [when-to-mock](../references/architecture/when-to-mock.md "Only reach for mocks when the real thing is slow, flaky, or has side effects you can't control in a test.").
4. Do not mock the code under test, because [when-to-mock](../references/architecture/when-to-mock.md "Don't mock the thing you're testing.").
5. Keep a real dependency that is a simple in-memory data structure or a pure function, because [when-to-mock](../references/architecture/when-to-mock.md "If a dependency is a simple in-memory data structure or a pure function, there's no reason to mock it.").
6. Classify slow dependencies such as network, file system, and database calls, because [when-to-mock](../references/architecture/when-to-mock.md "Network requests, file system operations, and database calls can make your tests take seconds instead of milliseconds.").
7. Classify non-deterministic values such as dates, random numbers, and UUIDs, because [when-to-mock](../references/architecture/when-to-mock.md "If your code depends on the current date, a random number, or a UUID generator, mock those to make your tests predictable.").
8. Split a function dependency into observing versus replacing, because [functions](../references/mocking/functions.md "Mocking functions can be split up into two different categories: spying and mocking.").
9. Read the cheat sheet entry that matches what the test needs, because [mocking](../references/mocking/mocking.md "For a simpler and quicker way to get started with mocking, you can check the Cheat Sheet below.").
10. Check whether the function is executed at the top level during an import or called before the spying, because [modules](../references/mocking/modules.md "if the function is executed at the top level during an import or it was called before the spying, `vi.spyOn` will not be able to report on it.").
11. Process: Name the dependency kind and the chosen technique before changing code. If the docs do not cover the kind, say so.

## Design and implement

1. To observe a method on an object, use `vi.spyOn`, because [functions](../references/mocking/functions.md "If you need to observe the behaviour of a method on an object, you can use [`vi.spyOn()`](/api/vi#vi-spyon) to create a spy that tracks calls to that method.").
2. To pass a custom function or create a new mocked entity, use `vi.fn`, because [functions](../references/mocking/functions.md "If you need to pass down a custom function implementation as an argument or create a new mocked entity, you can use [`vi.fn()`](/api/vi#vi-fn) to create a mock function.").
3. To return a value whenever the mock is called, use `mockReturnValue`, because [mock](../references/api/mock.md "Accepts a value that will be returned whenever the mock function is called.").
4. To define a new module dynamically, give `vi.mock` a factory that returns a new module as a second argument, because [modules](../references/mocking/modules.md "You can define a new module dynamically by providing a factory that returns a new module as a second argument:").
5. Make a factory export trackable with `vi.fn`, because [modules](../references/mocking/modules.md "Note that `answer` is not mocked, i.e. it cannot be tracked. To make it trackable, use `vi.fn()` instead:").
6. To get the original module's object inside a factory, use `importOriginal`, because [modules](../references/mocking/modules.md "The factory method accepts an `importOriginal` function that will execute the original module and return its module object:").
7. To mock a module for every test file, call `vi.mock` in a setup file, because [modules](../references/mocking/modules.md "Remember that you can call `vi.mock` in a [setup file](/config/setupfiles) to apply the module mock in every test file automatically.").
8. To reference outer variables inside `vi.mock`, define them with `vi.hoisted`, because [vi](../references/api/vi.md "If you need to reference some variables outside of its scope, you can define them inside [`vi.hoisted`](#vi-hoisted) and reference them inside `vi.mock`.").
9. To disable automocking behavior for a module, pass `spy: true` as the second argument, because [modules](../references/mocking/modules.md "To disable this behavior, you can pass down `spy: true` as the second argument:").
10. To spy on a single export, import the module as a namespace object, because [modules](../references/mocking/modules.md "Instead of replacing the whole module, you can spy only on a single exported method. To do that, you need to import the module as a namespace object:").
11. To mock a class, use a single `vi.fn` call, because [classes](../references/mocking/classes.md "You can mock an entire class with a single [`vi.fn`](/api/vi#fn) call.").
12. Prefer the class syntax over the function when mocking classes, because [classes](../references/mocking/classes.md "If you are mocking classes, prefer the class syntax over the function.").
13. To mock one method on one instance, use `vi.spyOn`, because [classes](../references/mocking/classes.md "If you want to mock the method of one instance only, use [`vi.spyOn`](/api/vi#vi-spyon).").
14. To mock a non-function property, spy on its getter, because [classes](../references/mocking/classes.md "To mock a non-function property, like `name`, we can use the `vi.spyOn(dog, 'name', 'get')` method.").
15. To mock a global variable that is not present with `jsdom` or `node`, use `vi.stubGlobal`, because [globals](../references/mocking/globals.md "You can mock global variables that are not present with `jsdom` or `node` by using [`vi.stubGlobal`](/api/vi#vi-stubglobal) helper.").
16. The docs recommend `memfs` for mocking the file system, because [file-system](../references/mocking/file-system.md "Vitest doesn't provide any file system mocking API out of the box. You can use `vi.mock` to mock the `fs` module manually, but it's hard to maintain. Instead, we recommend using [`memfs`](https://npmx.dev/package/memfs) to do that for you.").
17. To redirect every `fs` call to `memfs`, create the documented mock files, because [file-system](../references/mocking/file-system.md "To automatically redirect every `fs` call to `memfs`, you can create `__mocks__/fs.cjs` and `__mocks__/fs/promises.cjs` files at the root of your project:").
18. The docs recommend Mock Service Worker for mocking network requests, because [network-mocking](../references/mocking/network-mocking.md "We recommend [Mock Service Worker](https://mswjs.io/) to accomplish this.").
19. To control timers, enable fake timers with `vi.useFakeTimers`, because [vi](../references/api/vi.md "To enable mocking timers, you need to call this method.").
20. To change the system clock while fake timers are enabled, use `vi.setSystemTime`, because [vi](../references/api/vi.md "If fake timers are enabled, this method simulates a user changing the system clock").
21. For argument-based returns, use `vi.when` with `calledWith`, because [conditional-mocking](../references/mocking/conditional-mocking.md "Call `.calledWith(...args)` to declare which arguments to match.").
22. To fail on unregistered arguments, pass `onUnmatched`, because [conditional-mocking](../references/mocking/conditional-mocking.md "Pass `{ onUnmatched: 'throw' }` to throw whenever the spy is called with unregistered arguments:").
23. Clear or restore mocks before or after each test, because [mocking](../references/mocking/mocking.md "Always remember to clear or restore mocks before or after each test run to undo mock state changes between runs!").
24. To undo a spy, use `mockRestore`, because [mock](../references/api/mock.md "Does what [`mockReset`](#mockreset) does and restores the original descriptors of spied-on objects, if the mock was created with [`vi.spyOn`](/api/vi#vi-spyon).").
25. To restore all spies automatically, use `restoreMocks`, because [mocking](../references/mocking/mocking.md "Even better, you can configure this globally with the [`restoreMocks`](/config/restoremocks) option so you don't need the `afterEach` at all:").
26. Know that `vi.restoreAllMocks` leaves automocked modules alone, because [vi](../references/api/vi.md "This method also does not affect mocks created during [automocking](/guide/mocking/modules#mocking-a-module).").
27. To restore stubbed globals, use `unstubGlobals` or `vi.unstubAllGlobals`, because [globals](../references/mocking/globals.md "By default, Vitest does not reset these globals, but you can turn on the [`unstubGlobals`](/config/unstubglobals) option in your config to restore the original values after each test or call [`vi.unstubAllGlobals()`](/api/vi#vi-unstuballglobals) manually.").
28. When timers have run out, `vi.useRealTimers` can be called to return mocked timers to their original implementations, because [vi](../references/api/vi.md "When timers have run out, you may call this method to return mocked timers to its original implementations.").
29. If the runtime supports Explicit Resource Management, declare the spy with `using`, because [explicit-resources](../references/mocking/explicit-resources.md "declare the spy with `using` instead of `const`, and restoration happens automatically when the block exits.").
30. If your environment does not support `using` yet, `onTestFinished` is the closest equivalent for whole-test cleanup, because [explicit-resources](../references/mocking/explicit-resources.md "If your environment doesn't support it yet, the closest equivalent for whole-test cleanup is [`onTestFinished`](/api/hooks#ontestfinished)").
31. Process: Change only the dependency and test code the named technique requires.

## Verify behavior and challenge findings

1. Use a spy to verify that the code calls a method correctly, because [mocking](../references/mocking/mocking.md "This is particularly useful when you want to verify that your code calls a method correctly").
2. Read recorded arguments from `mock.calls`, because [mock](../references/api/mock.md "This is an array containing all arguments for each call.").
3. Process: Challenge the mock. Remove the mock or its call assertion and check whether the test fails or the real dependency runs. If neither happens, report that the mock was not shown to be in use.
4. Run the whole suite and confirm the restoration choice leaks no state, because [mocking](../references/mocking/mocking.md "If you don't reset them between tests, this state can leak and cause confusing failures.").
5. Process: Confirm that no other test changed from passing to failing.

## Acceptance evidence

1. Process: The dependency kind, the technique chosen, and the cited docs text for it.
2. Process: The assertion output showing the mock was called with the expected arguments.
3. Process: The cleanup or restoration mechanism used and the full-suite run output.

## References

- [when-to-mock.md](../references/architecture/when-to-mock.md)
- [mocking.md](../references/mocking/mocking.md)
- [functions.md](../references/mocking/functions.md)
- [modules.md](../references/mocking/modules.md)
- [classes.md](../references/mocking/classes.md)
- [globals.md](../references/mocking/globals.md)
- [file-system.md](../references/mocking/file-system.md)
- [clock-mocking.md](../references/mocking/clock-mocking.md)
- [network-mocking.md](../references/mocking/network-mocking.md)
- [conditional-mocking.md](../references/mocking/conditional-mocking.md)
- [explicit-resources.md](../references/mocking/explicit-resources.md)
- [vi.md](../references/api/vi.md)
- [mock.md](../references/api/mock.md)
