<!-- Verbatim excerpts from the official Vitest documentation, v5.1.1 (https://github.com/vitest-dev/vitest/tree/161e25f663a838f6a30890f8a6827ff83ff1b3c7/docs).
     Only this comment, the H1, the table of contents, and the "Source:" comments are generated. Every other line is copied from the docs.
     Root-relative links (e.g. /api/vi) resolve against https://vitest.dev. Do not edit. Regenerate with scripts/build.mjs. -->

# Context & Commands

## Table of Contents

1. Context API (api/browser/context.md)
   - `userEvent`
   - `commands`
   - `page`
   - `cdp`
   - `server`
   - `utils`
2. Commands (api/browser/commands.md)
   - Built-in Commands
   - CDP Session
   - Custom Commands

<!-- Source: https://vitest.dev/api/browser/context | docs/api/browser/context.md -->

# Context API

Vitest exposes a context module via `vitest/browser` entry point. As of 2.0, it exposes a small set of utilities that might be useful to you in tests.

## `userEvent`

::: tip
The `userEvent` API is explained in detail at [Interactivity API](/api/browser/interactivity).
:::

```ts
/**
 * Handler for user interactions. The support is implemented by the browser provider (`playwright` or `webdriverio`).
 * If used with `preview` provider, fallbacks to simulated events via `@testing-library/user-event`.
 * @experimental
 */
export const userEvent: {
  setup: () => UserEvent
  cleanup: () => Promise<void>
  click: (element: Element, options?: UserEventClickOptions) => Promise<void>
  dblClick: (element: Element, options?: UserEventDoubleClickOptions) => Promise<void>
  tripleClick: (element: Element, options?: UserEventTripleClickOptions) => Promise<void>
  selectOptions: (
    element: Element,
    values: HTMLElement | HTMLElement[] | string | string[],
    options?: UserEventSelectOptions,
  ) => Promise<void>
  keyboard: (text: string) => Promise<void>
  type: (element: Element, text: string, options?: UserEventTypeOptions) => Promise<void>
  clear: (element: Element) => Promise<void>
  tab: (options?: UserEventTabOptions) => Promise<void>
  hover: (element: Element, options?: UserEventHoverOptions) => Promise<void>
  unhover: (element: Element, options?: UserEventHoverOptions) => Promise<void>
  fill: (element: Element, text: string, options?: UserEventFillOptions) => Promise<void>
  dragAndDrop: (source: Element, target: Element, options?: UserEventDragAndDropOptions) => Promise<void>
}
```

## `commands`

::: tip
This API is explained in detail at [Commands API](/api/browser/commands).
:::

```ts
/**
 * Available commands for the browser.
 * A shortcut to `server.commands`.
 */
export const commands: BrowserCommands
```

## `page`

The `page` export provides utilities to interact with the current `page`.

::: warning
While it exposes some utilities from Playwright's `page`, it is not the same object. Since the browser context is evaluated in the browser, your tests don't have access to Playwright's `page` because it runs on the server.

Use [Commands API](/api/browser/commands) if you need to have access to Playwright's `page` object.
:::

```ts
export const page: {
  /**
   * Change the size of iframe's viewport.
   */
  viewport(width: number, height: number): Promise<void>
  /**
   * Make a screenshot of the test iframe or a specific element.
   * @returns Path to the screenshot file or path and base64.
   */
  screenshot(options: Omit<ScreenshotOptions, 'base64'> & { base64: true }): Promise<{
    path: string
    base64: string
  }>
  screenshot(options?: ScreenshotOptions): Promise<string>
  /**
   * Add a trace marker when browser tracing is enabled.
   */
  mark(name: string, options?: { stack?: string; kind?: BrowserTraceEntryKind }): Promise<void>
  /**
   * Group multiple operations under a trace marker when browser tracing is enabled.
   */
  mark<T>(name: string, body: () => T | Promise<T>, options?: { stack?: string; kind?: BrowserTraceEntryKind }): Promise<T>
  /**
   * Extend default `page` object with custom methods.
   */
  extend(methods: Partial<BrowserPage>): BrowserPage
  /**
   * Wrap an HTML element in a `Locator`. When querying for elements, the search will always return this element.
   */
  elementLocator(element: Element): Locator
  /**
   * The iframe locator. This is a document locator that enters the iframe body
   * and works similarly to the `page` object.
   * **Warning:** At the moment, this is supported only by the `playwright` provider.
   */
  frameLocator(iframeElement: Locator): FrameLocator

  /**
   * Locator APIs. See its documentation for more details.
   */
  getByRole(role: ARIARole | string, options?: LocatorByRoleOptions): Locator
  getByLabelText(text: string | RegExp, options?: LocatorOptions): Locator
  getByTestId(text: string | RegExp): Locator
  getByAltText(text: string | RegExp, options?: LocatorOptions): Locator
  getByPlaceholder(text: string | RegExp, options?: LocatorOptions): Locator
  getByText(text: string | RegExp, options?: LocatorOptions): Locator
  getByTitle(text: string | RegExp, options?: LocatorOptions): Locator
}
```

::: tip
The `getBy*` API is explained at [Locators API](/api/browser/locators).
:::

::: warning WARNING <Version>3.2.0</Version>
Note that `screenshot` will always return a base64 string if `save` is set to `false`.
The `path` is also ignored in that case.
:::

### mark

```ts
function mark(name: string, options?: { stack?: string; kind?: BrowserTraceEntryKind }): Promise<void>
function mark<T>(
  name: string,
  body: () => T | Promise<T>,
  options?: { stack?: string; kind?: BrowserTraceEntryKind },
): Promise<T>
```

Adds a named marker to the trace timeline for the current test.

Pass `options.stack` to override the callsite location in trace metadata. This is useful for wrapper libraries that need to preserve the end-user source location.

Pass `options.kind` to categorize your marker as specific type, for example as `'action'`.

If you pass a callback, Vitest creates a trace group with this name, runs the callback, and closes the group automatically.

```ts
import { page } from 'vitest/browser'

await page.mark('before submit')
await page.getByRole('button', { name: 'Submit' }).click()
await page.mark('after submit')

await page.mark('submit flow', async () => {
  await page.getByRole('textbox', { name: 'Email' }).fill('john@example.com')
  await page.getByRole('button', { name: 'Submit' }).click()
}, { kind: 'action' })
```

::: tip
This method is useful only when [`browser.trace`](/config/browser/trace) is enabled.

A server-side equivalent is available on the [`BrowserCommandContext`](/api/browser/commands#recording-trace-markers) so [custom commands](/api/browser/commands#custom-commands) can record markers attributed to the test that triggered them.
:::

### frameLocator

```ts
function frameLocator(iframeElement: Locator): FrameLocator
```

The `frameLocator` method returns a `FrameLocator` instance that can be used to find elements inside the iframe.

The frame locator is similar to `page`. It does not refer to the Iframe HTML element, but to the iframe's document.

```ts
const frame = page.frameLocator(
  page.getByTestId('iframe')
)

await frame.getByText('Hello World').click() // ✅
await frame.click() // ❌ Not available
```

::: danger IMPORTANT
By default `frameLocator` does not support querying elements with `expect.element()` in cross-origin iframes. Interactive methods, such as `.click()` work fine. This is different behaviour than Playwright.

```ts
const frame = page.frameLocator(page.getByTestId('cross-origin-iframe'))
const button = frame.getByRole('button', { name: 'Submit' })

await button.click() // Interactive methods work fine ✅
await expect.element(button).toBeVisible() // Querying elements does not work ❌
```

If you need to work with cross-origin iframes, you'll need to pass `args: ["--disable-web-security"]` in [`launchOptions`](/config/browser/playwright#launchoptions). Or alternatively create a custom [browser command](/api/browser/commands#custom-commands) that accesses the iframe on server side where it's available.
:::

::: danger IMPORTANT
At the moment, the `frameLocator` method is only supported by the `playwright` provider.

The interactive methods (like `click` or `fill`) are always available on elements within the iframe, but assertions with `expect.element` require the iframe to have the [same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy).
:::

## `cdp`

```ts
function cdp(): CDPSession
```

The `cdp` export returns the current Chrome DevTools Protocol session. It is mostly useful to library authors to build tools on top of it.

::: warning
CDP session works only with `playwright` provider and only when using `chromium` browser. You can read more about it in playwright's [`CDPSession`](https://playwright.dev/docs/api/class-cdpsession) documentation.

CDP is a privileged debugging API. It is available only when browser API write and exec operations are enabled through [`api.allowWrite`](/config/api#api-allowwrite), and [`api.allowExec`](/config/api#api-allowexec).
:::

```ts
export const cdp: () => CDPSession
```

## `server`

The `server` export represents the Node.js environment where the Vitest server is running. It is mostly useful for debugging or limiting your tests based on the environment.

```ts
export const server: {
  /**
   * Platform the Vitest server is running on.
   * The same as calling `process.platform` on the server.
   */
  platform: Platform
  /**
   * Runtime version of the Vitest server.
   * The same as calling `process.version` on the server.
   */
  version: string
  /**
   * Name of the browser provider.
   */
  provider: string
  /**
   * Name of the current browser.
   */
  browser: string
  /**
   * Available commands for the browser.
   */
  commands: BrowserCommands
  /**
   * Serialized test config.
   */
  config: SerializedConfig
}
```

## `utils`

Utility functions useful for custom render libraries.

```ts
export const utils: {
  /**
   * This is similar to calling `page.elementLocator`, but it returns only
   * locator selectors.
   */
  getElementLocatorSelectors(element: Element): LocatorSelectors
  /**
   * Prints prettified HTML of an element.
   */
  debug(
    el?: Element | Locator | null | (Element | Locator)[],
    maxLength?: number,
    options?: PrettyDOMOptions,
  ): void
  /**
   * Returns prettified HTML of an element.
   */
  prettyDOM(
    dom?: Element | Locator | undefined | null,
    maxLength?: number,
    prettyFormatOptions?: PrettyDOMOptions,
  ): string
  /**
   * Configures default options of `prettyDOM` and `debug` functions.
   * This will also affect `vitest-browser-{framework}` package.
   */
  configurePrettyDOM(options: StringifyOptions): void
  /**
   * Creates "Cannot find element" error. Useful for custom locators.
   */
  getElementError(selector: string, container?: Element): Error
  /**
   * Utilities for generating and working with ARIA trees and templates.
   * @experimental
   */
  aria: {
    generateAriaTree(rootElement: Element): AriaNode
    renderAriaTree(root: AriaNode): string
    renderAriaTemplate(template: AriaTemplateNode): string
    parseAriaTemplate(text: string): AriaTemplateNode
    matchAriaTree(root: AriaNode, template: AriaTemplateNode): { pass: boolean; resolved: string }
  }
}
```

### configurePrettyDOM <Version>4.0.0</Version> {#configureprettydom}

The `configurePrettyDOM` function allows you to configure default options for the `prettyDOM` and `debug` functions. This is useful for customizing how HTML is formatted in test failure messages.

```ts
import { utils } from 'vitest/browser'

utils.configurePrettyDOM({
  maxDepth: 3,
  filterNode: 'script, style, [data-test-hide]'
})
```

#### Options

- **`maxDepth`** - Maximum depth to print nested elements (default: `Infinity`)
- **`maxLength`** - Maximum length of the output string (default: `7000`)
- **`filterNode`** - A CSS selector string or function to filter out nodes from the output. When a string is provided, elements matching the selector will be excluded. When a function is provided, it should return `false` to exclude a node.
- **`highlight`** - Enable syntax highlighting (default: `true`)
- And other options from [`@vitest/pretty-format`](https://npmx.dev/package/@vitest/pretty-format)

#### Filtering with CSS Selectors <Version>4.1.0</Version> {#filtering-with-css-selectors}

The `filterNode` option allows you to hide irrelevant markup (like scripts, styles, or hidden elements) from test failure messages, making it easier to identify the actual cause of failures.

```ts
import { utils } from 'vitest/browser'

// Filter out common noise elements
utils.configurePrettyDOM({
  filterNode: 'script, style, [data-test-hide]'
})

// Or use directly with prettyDOM
const html = utils.prettyDOM(element, undefined, {
  filterNode: 'script, style'
})
```

**Common Patterns:**

Filter out scripts and styles:

```ts
utils.configurePrettyDOM({ filterNode: 'script, style' })
```

Hide specific elements with data attributes:

```ts
utils.configurePrettyDOM({ filterNode: '[data-test-hide]' })
```

Hide nested content within an element:

```ts
// Hides all children of elements with data-test-hide-content
utils.configurePrettyDOM({ filterNode: '[data-test-hide-content] *' })
```

Combine multiple selectors:

```ts
utils.configurePrettyDOM({
  filterNode: 'script, style, [data-test-hide], svg'
})
```

::: tip
This feature is inspired by Testing Library's [`defaultIgnore`](https://testing-library.com/docs/dom-testing-library/api-configuration/#defaultignore) configuration.
:::

### aria <Version type="experimental">5.0.0</Version> {#aria}

The `aria` namespace exposes low-level utilities used by Vitest's ARIA snapshot matchers.

```ts
import { utils } from 'vitest/browser'

document.body.innerHTML = `
  <h1>Hello, World!</h1>
  <button aria-hidden="true">Hidden</button>
  <button>Visible</button>
`
const tree = utils.aria.generateAriaTree(document.body)
const yaml = utils.aria.renderAriaNode(tree)
console.log(yaml)
// - heading "Hello, World!" [level=1]
// - button "Visible""
```

<!-- Source: https://vitest.dev/api/browser/commands | docs/api/browser/commands.md -->

# Commands

Command is a function that invokes another function on the server and passes down the result back to the browser. Vitest exposes several built-in commands you can use in your browser tests.

## Built-in Commands

### Files Handling

You can use the `readFile`, `writeFile`, and `removeFile` APIs to handle files in your browser tests. Since Vitest 3.2, all paths are resolved relative to the [project](/guide/projects) root (which is `process.cwd()`, unless overridden manually). Previously, paths were resolved relative to the test file.

By default, Vitest uses `utf-8` encoding but you can override it with options.

::: tip
The built-in file commands follow Vite's [`server.fs`](https://vitejs.dev/config/server-options.html#server-fs-allow) restrictions for security reasons.

`writeFile` and `removeFile` also require write access through [`api.allowWrite`](/config/api#api-allowwrite).
:::

```ts
import { server } from 'vitest/browser'

const { readFile, writeFile, removeFile } = server.commands

it('handles files', async () => {
  const file = './test.txt'

  await writeFile(file, 'hello world')
  const content = await readFile(file)

  expect(content).toBe('hello world')

  await removeFile(file)
})
```

## CDP Session

Vitest exposes access to raw Chrome DevTools Protocol via the `cdp` method exported from `vitest/browser`. It is mostly useful to library authors to build tools on top of it.

```ts
import { cdp } from 'vitest/browser'

const input = document.createElement('input')
document.body.appendChild(input)
input.focus()

await cdp().send('Input.dispatchKeyEvent', {
  type: 'keyDown',
  text: 'a',
})

expect(input).toHaveValue('a')
```

::: warning
CDP session works only with `playwright` provider and only when using `chromium` browser. You can read more about it in playwright's [`CDPSession`](https://playwright.dev/docs/api/class-cdpsession) documentation.

CDP is a privileged debugging API. It is available only when browser API write and exec operations are enabled through [`api.allowWrite`](/config/api#api-allowwrite), and [`api.allowExec`](/config/api#api-allowexec).
:::

## Custom Commands

You can also add your own commands via [`browser.commands`](/config/browser/commands) config option. If you develop a library, you can provide them via a `config` hook inside a plugin:

```ts
import type { Plugin } from 'vitest/config'
import type { BrowserCommand } from 'vitest/node'

const myCustomCommand: BrowserCommand<[arg1: string, arg2: string]> = ({
  testPath,
  provider
}, arg1, arg2) => {
  if (provider.name === 'playwright') {
    console.log(testPath, arg1, arg2)
    return { someValue: true }
  }

  throw new Error(`provider ${provider.name} is not supported`)
}

export default function BrowserCommands(): Plugin {
  return {
    name: 'vitest:custom-commands',
    config() {
      return {
        test: {
          browser: {
            commands: {
              myCustomCommand,
            }
          }
        }
      }
    }
  }
}
```

Then you can call it inside your test by importing it from `vitest/browser`:

```ts
import { commands } from 'vitest/browser'
import { expect, test } from 'vitest'

test('custom command works correctly', async () => {
  const result = await commands.myCustomCommand('test1', 'test2')
  expect(result).toEqual({ someValue: true })
})

// if you are using TypeScript, you can augment the module
declare module 'vitest/browser' {
  interface BrowserCommands {
    myCustomCommand: (arg1: string, arg2: string) => Promise<{
      someValue: true
    }>
  }
}
```

::: warning
Custom functions will override built-in ones if they have the same name.
:::

::: warning Security
Custom commands run in the Vitest Node process and are callable from browser test code through Vitest's browser RPC connection. They can access local files, environment variables, network services, databases, shell commands, and other Node APIs.

Vitest's built-in file commands validate paths against Vite's [`server.fs`](https://vite.dev/config/server-options#server-fs-allow) restrictions and separately check whether writes are allowed. Custom commands do not automatically inherit these protections. If a custom command accepts browser-provided input and uses it to read, write, delete, execute, or expose local resources, validate that input before using it.

For file reads or fixture loading, use `isFileLoadingAllowed` from `vitest/node` or an explicit allowlist. For writes and deletes, also require an explicit mutation policy, such as [`api.allowWrite`](/config/api#api-allowwrite), and a command-specific allowed directory. For commands that execute code, shell commands, or project scripts, also check [`api.allowExec`](/config/api#api-allowexec).

For example, if you create your own file-writing command instead of using Vitest's built-in `writeFile`, apply the same checks:

```ts
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { normalizePath } from 'vite'
import { isFileLoadingAllowed } from 'vitest/node'
import type { BrowserCommand } from 'vitest/node'

function assertFileAccess(path: string, project: any) {
  if (
    !isFileLoadingAllowed(project.vite.config, path)
    && !isFileLoadingAllowed(project.vitest.vite.config, path)
  ) {
    throw new Error(`Access denied to "${path}".`)
  }
}

function assertWrite(project: any) {
  if (!project.config.browser.api.allowWrite || !project.vitest.config.api.allowWrite) {
    throw new Error('Writing files is disabled.')
  }
}

export const myWriteFileCommand: BrowserCommand<[path: string, content: string]> = async (
  { project },
  path,
  content,
) => {
  assertWrite(project)

  const file = resolve(project.config.root, path)
  assertFileAccess(normalizePath(file), project)

  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, content)
}
```

:::

### Recording trace markers

Custom commands can record [trace markers](/api/browser/context#mark) for the test that triggered them through `context.mark`. This is the server-side equivalent of `page.mark` and helps annotate the [trace view](/guide/browser/trace-view) with custom actions performed inside a command.

```ts
import type { BrowserCommand } from 'vitest/node'

export const uploadFixture: BrowserCommand<[name: string]> = async (
  context,
  name,
) => {
  await context.mark(`upload start: ${name}`, { kind: 'action' })
  // ... do server-side work
  await context.mark(`upload done: ${name}`, { kind: 'action' })
}
```

`context.mark` is a no-op when browser tracing is not enabled or no test is currently running in the session. Unlike `page.mark`, it does not accept a callback form.

### Custom `playwright` commands

Vitest exposes several `playwright` specific properties on the command context.

- `page` references the full page that contains the test iframe. This is the orchestrator HTML and you most likely shouldn't touch it to not break things.
- `frame` is an async method that will resolve tester [`Frame`](https://playwright.dev/docs/api/class-frame). It has a similar API to the `page`, but it doesn't support certain methods. If you need to query an element, you should prefer using `context.iframe` instead because it is more stable and faster.
- `iframe` is a [`FrameLocator`](https://playwright.dev/docs/api/class-framelocator) that should be used to query other elements on the page.
- `context` refers to the unique [BrowserContext](https://playwright.dev/docs/api/class-browsercontext).

```ts
import { BrowserCommand } from 'vitest/node'

export const myCommand: BrowserCommand<[string, number]> = async (
  ctx,
  arg1: string,
  arg2: number
) => {
  if (ctx.provider.name === 'playwright') {
    const element = await ctx.iframe.findByRole('alert')
    const screenshot = await element.screenshot()
    // do something with the screenshot
    return difference
  }
}
```

### Custom `webdriverio` commands

Vitest exposes some `webdriverio` specific properties on the context object.

- `browser` is the `WebdriverIO.Browser` API.

Vitest automatically switches the `webdriver` context to the test iframe by calling `browser.switchFrame` before the command is called, so `$` and `$$` methods refer to the elements inside the iframe, not in the orchestrator, but non-webdriver APIs will still refer to the parent frame context.
