# Browser Mode and Component Tests

## When to use

- When a component or page needs tests that run in a real browser
- When a visual change or an accessibility structure needs to be checked by a test
- When a Browser Mode test fails and the cause is unclear

## Investigate and establish evidence

1. Process: Record the goal, the component or page under test, and the success check, before running anything.
2. Process: Delegate the browser test runs and the collection of failure output to a subagent. Read the failures yourself.
3. Check whether Browser Mode is set up, because [browser-mode](../references/browser-mode/browser-mode.md "To activate browser mode in your Vitest configuration, set the `browser.enabled` field to `true` in your Vitest configuration file.").
4. Check that a provider is defined, because [browser-mode](../references/browser-mode/browser-mode.md "Vitest always requires a provider to be defined.").
5. If Browser Mode is not set up, the init command can be used for easier setup, because [browser-mode](../references/browser-mode/browser-mode.md "For easier setup, you can use `vitest init browser` command to install required dependencies and create browser configuration.").
6. Check which browsers and setups the config runs, because [multiple-setups](../references/browser-mode/multiple-setups.md "You can use the `browser.instances` field to specify options for different browsers.").
7. Check whether a Node-based project sits next to the browser project, because [browser-mode](../references/browser-mode/browser-mode.md "you can define a [`projects`](/guide/projects) option with separate configurations for different testing strategies:").
8. Check whether the test is affected by discrepancies between a simulated browser environment and a real one, because [test-architecture](../references/architecture/test-architecture.md "these tools only simulate a browser environment and not an actual browser, which may result in some discrepancies between the simulated environment and the real environment.").
9. For React, `vitest-browser-react` is an option, because [react](../references/frameworks/react.md "the `vitest-browser-react` package provides certain benefits unique to the Browser Mode that `@testing-library/react` lacks:").
10. For Vue, `vitest-browser-vue` is an option, because [vue](../references/frameworks/vue.md "the `vitest-browser-vue` package provides certain benefits unique to the Browser Mode that `@testing-library/vue` lacks:").
11. For Svelte, `vitest-browser-svelte` is an option, because [svelte](../references/frameworks/svelte.md "the `vitest-browser-svelte` package provides certain benefits unique to the Browser Mode that `@testing-library/svelte` lacks:").
12. Process: Run the failing or target browser test once and record the output as given.

## Design and implement

1. For React, await `render`, because [react](../references/frameworks/react.md "Note that `render` is asynchronous, unlike in other packages.").
2. For React, import from the main entry point rather than `pure` when the component should be removed before the next test, because [react](../references/frameworks/react.md "the `pure` entry point doesn't add a handler to remove the component before the next test has started.").
3. For a framework without an official package, Testing Library can be integrated, because [component-testing](../references/testing-patterns/component-testing.md "you can integrate with [Testing Library](https://testing-library.com/) for frameworks not yet officially supported.").
4. Test behavior, not internals, because [component-testing](../references/testing-patterns/component-testing.md "Good component tests focus on **behavior and user experience** rather than implementation details:").
5. When querying a single element with `getByText`, `getByRole` with a name is often better, because [locators](../references/browser-mode/locators.md "it's oftentimes better to use `getByRole(expectedRole, { name: 'The name' })`.").
6. The docs recommend a test id only after the other locators do not work for the use case, because [locators](../references/browser-mode/locators.md "It is recommended to use this only after the other locators don't work for your use case.").
7. `.element()` and `.query()` throw if several elements match, because [locators](../references/browser-mode/locators.md "Single-element escape hatches like `.element()` and `.query()` are strict and throw if multiple elements match.").
8. With `playwright` and `webdriverio` providers, `userEvent.*` calls and locator shortcuts like `locator.click()` use the same underlying interaction state, because [interactivity](../references/browser-mode/interactivity.md "This applies both to `userEvent.*` calls and locator shortcuts like `locator.click()` or `locator.hover()`").
9. When keyboard state must carry across calls, create an instance with `userEvent.setup`, because [interactivity](../references/browser-mode/interactivity.md "This is useful if you need to keep the state of keyboard to press and release buttons correctly.").
10. The docs recommend `expect.element` when working with `page.getBy*` locators, because [assertions](../references/browser-mode/assertions.md "We recommend to always use `expect.element` when working with `page.getBy*` locators to reduce test flakiness.").
11. `expect.element` retries DOM assertions until they pass or the timeout is reached, because [assertions](../references/browser-mode/assertions.md "`expect.element` retries DOM assertions until they pass or the timeout is reached.").
12. For a visual check, use `toMatchScreenshot`, because [visual-regression](../references/testing-patterns/visual-regression.md "Visual regression testing in Vitest can be done through the [`toMatchScreenshot` assertion](/api/browser/assertions#tomatchscreenshot):").
13. Add behavior assertions alongside it, because [visual-regression](../references/testing-patterns/visual-regression.md "Visual tests work best as a complementary layer on top of behavior tests, not a replacement for them").
14. For a visual suite, the recommended setup uses projects to keep it distinct from other tests, because [visual-regression](../references/testing-patterns/visual-regression.md "The recommended setup uses [projects](/guide/projects) with a `[name].vrt.test.[ext]` naming convention to keep them distinct").
15. Set a viewport for that project, because [visual-regression](../references/testing-patterns/visual-regression.md "As the browser instance might have a different default size, it also sets a specific viewport size.").
16. `toMatchScreenshot` disables animations on its own with the Playwright provider, because [visual-regression](../references/testing-patterns/visual-regression.md "When using the Playwright provider, animations are automatically disabled when using the built-in assertion").
17. Commit reference screenshots, because [visual-regression](../references/testing-patterns/visual-regression.md "Reference screenshots live in `__screenshots__` folders next to your tests. **Commit them to your repository.**").
18. Treat the first run as a reference-creating run, because [visual-regression](../references/testing-patterns/visual-regression.md "No existing reference screenshot found; a new one was created. Review it before running tests again.").
19. Review updated reference screenshots before committing, because [visual-regression](../references/testing-patterns/visual-regression.md "Review updated screenshots before committing to make sure changes are intentional.").
20. For accessibility structure, use `toMatchAriaSnapshot` to store the snapshot in a `.snap` file, because [accessibility](../references/testing-patterns/accessibility.md "Use `toMatchAriaSnapshot()` to store the snapshot in a `.snap` file alongside your test:").
21. Use the inline form to keep the snapshot in the test file, because [accessibility](../references/testing-patterns/accessibility.md "Use `toMatchAriaInlineSnapshot()` to store the snapshot directly in the test file:").
22. Hand-edited regex patterns in a snapshot survive `--update`, because [accessibility](../references/testing-patterns/accessibility.md "When you hand-edit a snapshot to use regex patterns, those patterns survive `--update`.").
23. Test keyboard navigation and focus too, because [component-testing](../references/testing-patterns/component-testing.md "Ensure components work for all users by testing keyboard navigation, focus management, and ARIA attributes.").
24. Process: Change only the tests and config the named cause or goal requires.
25. Process: Reject fixed-length waits in browser tests, and reject screenshot reference updates that nobody reviewed.

## Verify behavior and challenge findings

1. Run the tests with the browser flag, because [browser-mode](../references/browser-mode/browser-mode.md "To specify a browser using the CLI, use the `--browser` flag followed by the browser name, like this:").
2. Headless mode runs the browser in the background without a user interface, because [browser-mode](../references/browser-mode/browser-mode.md "In headless mode, the browser runs in the background without a user interface, which makes it useful for running automated tests.").
3. Filter which projects run with the `--project` flag, because [multiple-setups](../references/browser-mode/multiple-setups.md "You can filter what projects to run with the [`--project` flag](/guide/cli#project).").
4. When two instances use the same browser, give each a name, because [multiple-setups](../references/browser-mode/multiple-setups.md "Note that you need to define the custom `name` value if you are using the same browser name").
5. Vitest records only failed tests by default, because [traces](../references/browser-mode/traces.md "By default, Vitest records only failed tests, prints their steps in the terminal, and keeps a snapshot of the page when each test failed.").
6. Read the trace for a retried test, because [traces](../references/browser-mode/traces.md "Each retry or repeat of a test is recorded as a separate trace.").
7. Open traces in the HTML report when the run was in CI, because [traces](../references/browser-mode/traces.md "The trace viewer in the generated report, which suits CI").
8. A locator can create a screenshot of the element it matches, because [locators](../references/browser-mode/locators.md "Creates a screenshot of the element matching the locator's selector.").
9. Process: Challenge the cause. Revert the change, re-run the same browser test, and confirm it fails the same way. If it does not, the result is inconclusive.
10. Process: Confirm that no other test changed from passing to failing.

## Acceptance evidence

1. Process: The browser config, the provider, and the framework renderer found.
2. Process: The browser test command and its output before and after the change.
3. Process: For a failure, the trace or screenshot that shows the cause.
4. Process: For visual tests, the reference screenshots that changed and why.

## References

- [test-architecture.md](../references/architecture/test-architecture.md)
- [browser-mode.md](../references/browser-mode/browser-mode.md)
- [locators.md](../references/browser-mode/locators.md)
- [interactivity.md](../references/browser-mode/interactivity.md)
- [assertions.md](../references/browser-mode/assertions.md)
- [context-commands.md](../references/browser-mode/context-commands.md)
- [multiple-setups.md](../references/browser-mode/multiple-setups.md)
- [traces.md](../references/browser-mode/traces.md)
- [react.md](../references/frameworks/react.md)
- [vue.md](../references/frameworks/vue.md)
- [svelte.md](../references/frameworks/svelte.md)
- [component-testing.md](../references/testing-patterns/component-testing.md)
- [visual-regression.md](../references/testing-patterns/visual-regression.md)
- [accessibility.md](../references/testing-patterns/accessibility.md)
