<!-- Verbatim excerpts from the official Vitest documentation, v5.1.1 (https://github.com/vitest-dev/vitest/tree/161e25f663a838f6a30890f8a6827ff83ff1b3c7/docs).
     Only this comment, the H1, the table of contents, and the "Source:" comments are generated. Every other line is copied from the docs.
     Root-relative links (e.g. /api/vi) resolve against https://vitest.dev. Do not edit. Regenerate with scripts/build.mjs. -->

# Mocking Functions

## Table of Contents

1. Mocking Functions (guide/mocking/functions.md)
   - Example

<!-- Source: https://vitest.dev/guide/mocking/functions | docs/guide/mocking/functions.md -->

# Mocking Functions

Mocking functions can be split up into two different categories: spying and mocking.

If you need to observe the behaviour of a method on an object, you can use [`vi.spyOn()`](/api/vi#vi-spyon) to create a spy that tracks calls to that method.

If you need to pass down a custom function implementation as an argument or create a new mocked entity, you can use [`vi.fn()`](/api/vi#vi-fn) to create a mock function.

Both `vi.spyOn` and `vi.fn` share the same methods.

::: tip
If you need a mock to return different values depending on the arguments it receives, [`vi.when()`](/api/vi#vi-when) lets you define argument-specific behaviors without writing your own `if/else` logic. See the [Conditional Mocking](/guide/recipes/conditional-mocking) recipe for details.
:::

## Example

```js
import { afterEach, describe, expect, it, vi } from 'vitest'

const messages = {
  items: [
    { message: 'Simple test message', from: 'Testman' },
    // ...
  ],
  addItem(item) {
    messages.items.push(item)
    messages.callbacks.forEach(callback => callback(item))
  },
  onItem(callback) {
    messages.callbacks.push(callback)
  },
  getLatest, // can also be a `getter or setter if supported`
}

function getLatest(index = messages.items.length - 1) {
  return messages.items[index]
}

it('should get the latest message with a spy', () => {
  const spy = vi.spyOn(messages, 'getLatest')
  expect(spy.getMockName()).toEqual('getLatest')

  expect(messages.getLatest()).toEqual(
    messages.items.at(-1),
  )

  expect(spy).toHaveBeenCalledTimes(1)

  spy.mockImplementationOnce(() => 'access-restricted')
  expect(messages.getLatest()).toEqual('access-restricted')

  expect(spy).toHaveBeenCalledTimes(2)
})

it('passing down the mock', () => {
  const callback = vi.fn()
  messages.onItem(callback)

  messages.addItem({ message: 'Another test message', from: 'Testman' })
  expect(callback).toHaveBeenCalledWith({
    message: 'Another test message',
    from: 'Testman',
  })
})
```
