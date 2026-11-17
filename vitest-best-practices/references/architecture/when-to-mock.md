<!-- Verbatim excerpts from the official Vitest documentation, v5.1.1 (https://github.com/vitest-dev/vitest/tree/161e25f663a838f6a30890f8a6827ff83ff1b3c7/docs).
     Only this comment, the H1, the table of contents, and the "Source:" comments are generated. Every other line is copied from the docs.
     Root-relative links (e.g. /api/vi) resolve against https://vitest.dev. Do not edit. Regenerate with scripts/build.mjs. -->

# When to Mock

## Table of Contents

1. When to Mock (guide/learn/testing-in-practice.md)
   - Slow Dependencies
   - Non-Deterministic Values
   - What Not to Mock

<!-- Source: https://vitest.dev/guide/learn/testing-in-practice | docs/guide/learn/testing-in-practice.md | section: ## When to Mock -->

## When to Mock

Mocking is a powerful tool, but it's easy to overuse.

### Slow Dependencies

Network requests, file system operations, and database calls can make your tests take seconds instead of milliseconds. Replace them with mocks to keep the feedback loop fast.

For HTTP requests specifically, consider using [Mock Service Worker](https://mswjs.io/) instead of mocking fetch directly. See the [Mocking Requests](/guide/mocking/requests) guide for setup instructions.

### Non-Deterministic Values

If your code depends on the current date, a random number, or a UUID generator, mock those to make your tests predictable. Vitest provides [`vi.useFakeTimers()`](/api/vi#vi-usefaketimers) and [`vi.setSystemTime()`](/api/vi#vi-setsystemtime) for controlling time in tests.

### What Not to Mock

Don't mock the thing you're testing. If you're testing a `UserService`, don't mock the `UserService`. Mock its _dependencies_ (the database, the email sender) and let the service itself run for real.

Also, prefer real implementations when they're fast and reliable. If a dependency is a simple in-memory data structure or a pure function, there's no reason to mock it. The closer your tests are to real usage, the more confidence they give you.

::: tip
Only reach for mocks when the real thing is slow, flaky, or has side effects you can't control in a test.
:::
