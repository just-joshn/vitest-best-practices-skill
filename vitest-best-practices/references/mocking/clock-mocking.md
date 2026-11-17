<!-- Verbatim excerpts from the official Vitest documentation, v5.1.1 (https://github.com/vitest-dev/vitest/tree/161e25f663a838f6a30890f8a6827ff83ff1b3c7/docs).
     Only this comment, the H1, the table of contents, and the "Source:" comments are generated. Every other line is copied from the docs.
     Root-relative links (e.g. /api/vi) resolve against https://vitest.dev. Do not edit. Regenerate with scripts/build.mjs. -->

# Clock Mocking (Timers & Dates)

## Table of Contents

1. Timers (guide/mocking/timers.md)
   - Example
   - Automatic Advancing
   - Tick Modes
2. Mocking Dates (guide/mocking/dates.md)
   - Example

<!-- Source: https://vitest.dev/guide/mocking/timers | docs/guide/mocking/timers.md -->

# Timers

When we test code that involves timeouts or intervals, instead of having our tests wait it out or timeout, we can speed up our tests by using "fake" timers that mock calls to `setTimeout` and `setInterval`.

See the [`vi.useFakeTimers` API section](/api/vi#vi-usefaketimers) for a more in depth detailed API description.

## Example

```js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

function executeAfterTwoHours(func) {
  setTimeout(func, 1000 * 60 * 60 * 2) // 2 hours
}

function executeEveryMinute(func) {
  setInterval(func, 1000 * 60) // 1 minute
}

const mock = vi.fn(() => console.log('executed'))

describe('delayed execution', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.clearAllMocks()
  })
  it('should execute the function', () => {
    executeAfterTwoHours(mock)
    vi.runAllTimers()
    expect(mock).toHaveBeenCalledTimes(1)
  })
  it('should not execute the function', () => {
    executeAfterTwoHours(mock)
    // advancing by 2ms won't trigger the func
    vi.advanceTimersByTime(2)
    expect(mock).not.toHaveBeenCalled()
  })
  it('should execute every minute', () => {
    executeEveryMinute(mock)
    vi.advanceTimersToNextTimer()
    expect(mock).toHaveBeenCalledTimes(1)
    vi.advanceTimersToNextTimer()
    expect(mock).toHaveBeenCalledTimes(2)
  })
})
```

## Automatic Advancing {#automatic-advancing}

Some Vitest APIs wait for a condition to be met. When fake timers are enabled, these APIs advance them while they run:

- [`vi.waitFor`](/api/vi#vi-waitfor) and [`vi.waitUntil`](/api/vi#vi-waituntil) advance timers by `interval` before every check.
- [`expect.poll`](/api/expect#poll) advances timers by `interval` after every failed attempt.
- In Browser Mode, [`expect.element`](/api/browser/assertions) advances timers while it retries, and [locator](/api/browser/locators#methods) and [`userEvent`](/api/browser/interactivity) methods that take an element advance them while they run, even when the element already exists. The amount depends on how long the action takes in real time, so it can vary between runs. Methods that don't take an element, such as `userEvent.keyboard` and `userEvent.tab`, don't advance timers.

## Tick Modes {#tick-modes}

By default, fake timers only move when you advance them or when one of the APIs above runs. [`vi.setTimerTickMode`](/api/vi#vi-settimertickmode) makes them advance on their own:

- `interval` advances fake time by a fixed step on a real-time interval, so it stays roughly in step with real time. It suits code where some state only lasts for a limited time.
- `nextTimerAsync` runs the next pending timer after each macrotask, so chained timers fire almost back to back. It suits code that eventually settles, but state that only lasts for a limited time can disappear before an assertion or action sees it.

<!-- Source: https://vitest.dev/guide/mocking/dates | docs/guide/mocking/dates.md -->

# Mocking Dates

Sometimes you need to be in control of the date to ensure consistency when testing. Vitest uses [`@sinonjs/fake-timers`](https://github.com/sinonjs/fake-timers) package for manipulating timers, as well as system date. You can find more about the specific API in detail [here](/api/vi#vi-setsystemtime).

## Example

```js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const businessHours = [9, 17]

function purchase() {
  const currentHour = new Date().getHours()
  const [open, close] = businessHours

  if (currentHour > open && currentHour < close) {
    return { message: 'Success' }
  }

  return { message: 'Error' }
}

describe('purchasing flow', () => {
  beforeEach(() => {
    // tell vitest we use mocked time
    vi.useFakeTimers()
  })

  afterEach(() => {
    // restoring date after each test run
    vi.useRealTimers()
  })

  it('allows purchases within business hours', () => {
    // set hour within business hours
    const date = new Date(2000, 1, 1, 13)
    vi.setSystemTime(date)

    // access Date.now() will result in the date set above
    expect(purchase()).toEqual({ message: 'Success' })
  })

  it('disallows purchases outside of business hours', () => {
    // set hour outside business hours
    const date = new Date(2000, 1, 1, 19)
    vi.setSystemTime(date)

    // access Date.now() will result in the date set above
    expect(purchase()).toEqual({ message: 'Error' })
  })
})
```
