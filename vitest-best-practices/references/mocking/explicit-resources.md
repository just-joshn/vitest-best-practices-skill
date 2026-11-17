<!-- Verbatim excerpts from the official Vitest documentation, v5.1.1 (https://github.com/vitest-dev/vitest/tree/161e25f663a838f6a30890f8a6827ff83ff1b3c7/docs).
     Only this comment, the H1, the table of contents, and the "Source:" comments are generated. Every other line is copied from the docs.
     Root-relative links (e.g. /api/vi) resolve against https://vitest.dev. Do not edit. Regenerate with scripts/build.mjs. -->

# Auto-Cleanup with `using`

## Table of Contents

1. Auto-Cleanup with `using` (guide/recipes/explicit-resources.md)
   - Pattern
   - Scoped to any block
   - Compatibility
   - See also

<!-- Source: https://vitest.dev/guide/recipes/explicit-resources | docs/guide/recipes/explicit-resources.md -->

# Auto-Cleanup with `using`

Spies and mocks need to be restored after the test that installed them, otherwise state leaks between tests. The usual approaches are an `afterEach(() => vi.restoreAllMocks())` at the suite level or a per-test [`onTestFinished(() => spy.mockRestore())`](/api/hooks#ontestfinished) inline.

If your runtime supports [Explicit Resource Management](https://github.com/tc39/proposal-explicit-resource-management) (Node.js 24+, or via TypeScript 5.2+ in modern bundlers), there's a tighter option: declare the spy with `using` instead of `const`, and restoration happens automatically when the block exits.

This works for [`vi.spyOn`](/api/vi#vi-spyon), [`vi.fn`](/api/vi#vi-fn), and [`vi.doMock`](/api/vi#vi-domock). <Version>3.2.0</Version>

## Pattern

```ts
import { expect, it, vi } from 'vitest'

function debug(message: string) {
  console.log(message)
}

it('calls console.log', () => {
  using spy = vi.spyOn(console, 'log').mockImplementation(() => {})
  debug('message')
  expect(spy).toHaveBeenCalled()
})

// console.log is restored here without an afterEach
```

The same pattern works with `vi.doMock`, which returns a disposable that queues an unmock when the scope exits:

```ts
import { expect, it, vi } from 'vitest'

it('uses the mocked module, then the real one', async () => {
  {
    using _mock = vi.doMock('./users', () => ({
      loadUser: () => ({ id: '1', name: 'Alice' }),
    }))
    const { loadUser } = await import('./users')
    expect(loadUser('alice').name).toBe('Alice')
  }

  // ./users is unmocked from here on
})
```

## Scoped to any block

`using` is block-scoped, so you can install a spy for just part of a test. This is the case neither `afterEach` nor `onTestFinished` covers, since both run after the test ends:

```ts
import { expect, it, vi } from 'vitest'

it('only mocks fetch for the auth call', async () => {
  // real fetch here
  await preloadConfig()

  {
    using fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{"ok":true}'))

    await login('alice', 'secret')
    expect(fetchSpy).toHaveBeenCalledOnce()
  }

  // real fetch is back
  await reportSuccess()
})
```

This is also a way to avoid turning on the global [`restoreMocks: true`](/config/restoremocks) config when only a handful of calls actually need restoration.

## Compatibility

`using` requires support for the TC39 Explicit Resource Management proposal:

- TypeScript ≥ 5.2 (with `target: 'es2022'` or higher and the `disposable` lib included by default).
- Node.js ≥ 24 (or Node 22+ with `--harmony`-style flags) for native runtime support.

If your environment doesn't support it yet, the closest equivalent for whole-test cleanup is [`onTestFinished`](/api/hooks#ontestfinished), which registers the cleanup inline and runs after the test completes regardless of pass or failure:

```ts
import { expect, it, onTestFinished, vi } from 'vitest'

it('calls console.log', () => {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
  onTestFinished(() => spy.mockRestore())

  debug('message')
  expect(spy).toHaveBeenCalled()
})
```

`onTestFinished` can't tear down a spy mid-test the way `using` can, so the block-scoped pattern above remains specific to ERM.

## See also

- [`vi.spyOn`](/api/vi#vi-spyon)
- [`vi.fn`](/api/vi#vi-fn)
- [`vi.doMock`](/api/vi#vi-domock)
- [`onTestFinished`](/api/hooks#ontestfinished)
- [`restoreMocks`](/config/restoremocks)
- [TC39 Explicit Resource Management proposal](https://github.com/tc39/proposal-explicit-resource-management)
