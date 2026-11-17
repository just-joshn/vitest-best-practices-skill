<!-- Verbatim excerpts from the official Vitest documentation, v5.1.1 (https://github.com/vitest-dev/vitest/tree/161e25f663a838f6a30890f8a6827ff83ff1b3c7/docs).
     Only this comment, the H1, the table of contents, and the "Source:" comments are generated. Every other line is copied from the docs.
     Root-relative links (e.g. /api/vi) resolve against https://vitest.dev. Do not edit. Regenerate with scripts/build.mjs. -->

# Test Annotations

## Table of Contents

1. test.skip (api/test.md)
2. test.skipIf (api/test.md)
3. test.runIf (api/test.md)
4. test.only (api/test.md)
5. test.todo (api/test.md)
6. test.fails (api/test.md)
7. Test Annotations (guide/test-annotations.md)
   - Built-in Reporters

<!-- Source: https://vitest.dev/api/test | docs/api/test.md | section: ## test.skip -->

## test.skip

- **Alias:** `it.skip`

If you want to skip running certain tests, but you don't want to delete the code due to any reason, you can use `test.skip` to avoid running them.

```ts
import { assert, test } from 'vitest'

test.skip('skipped test', () => {
  // Test skipped, no error
  assert.equal(Math.sqrt(4), 3)
})
```

You can also skip test by calling `skip` on its [context](/guide/test-context) dynamically:

```ts
import { assert, test } from 'vitest'

test('skipped test', (context) => {
  context.skip()
  // Test skipped, no error
  assert.equal(Math.sqrt(4), 3)
})
```

If the condition is unknown, you can provide it to the `skip` method as the first arguments:

```ts
import { assert, test } from 'vitest'

test('skipped test', (context) => {
  context.skip(Math.random() < 0.5, 'optional message')
  // Test skipped, no error
  assert.equal(Math.sqrt(4), 3)
})
```

<!-- Source: https://vitest.dev/api/test | docs/api/test.md | section: ## test.skipIf -->

## test.skipIf

- **Alias:** `it.skipIf`

In some cases you might run tests multiple times with different environments, and some of the tests might be environment-specific. Instead of wrapping the test code with `if`, you can use `test.skipIf` to skip the test whenever the condition is truthy.

```ts
import { assert, test } from 'vitest'

const isDev = process.env.NODE_ENV === 'development'

test.skipIf(isDev)('prod only test', () => {
  // this test only runs in production
})
```

Unlike `test.skip`, `test.skipIf` always sets the [`skip`](#skip) option: `true` if the condition is truthy, `false` otherwise. A falsy condition overrides `skip` inherited from [tags](/guide/test-tags), the same as `test(name, { skip: false })`.

<!-- Source: https://vitest.dev/api/test | docs/api/test.md | section: ## test.runIf -->

## test.runIf

- **Alias:** `it.runIf`

Opposite of [test.skipIf](#test-skipif). It always sets the [`skip`](#skip) option: `false` if the condition is truthy, `true` otherwise.

```ts
import { assert, test } from 'vitest'

const isDev = process.env.NODE_ENV === 'development'

test.runIf(isDev)('dev only test', () => {
  // this test only runs in development
})
```

<!-- Source: https://vitest.dev/api/test | docs/api/test.md | section: ## test.only -->

## test.only

- **Alias:** `it.only`

Use `test.only` to only run certain tests in a given suite. This is useful when debugging.

```ts
import { assert, test } from 'vitest'

test.only('test', () => {
  // Only this test (and others marked with only) are run
  assert.equal(Math.sqrt(4), 2)
})
```

Sometimes it is very useful to run `only` tests in a certain file, ignoring all other tests from the whole test suite, which pollute the output.

In order to do that, run `vitest` with specific file containing the tests in question:

```shell
vitest interesting.test.ts
```

::: warning
Vitest detects when tests are running in CI and will throw an error if any test has `only` flag. You can configure this behaviour via [`allowOnly`](/config/allowonly) option.
:::

<!-- Source: https://vitest.dev/api/test | docs/api/test.md | section: ## test.todo -->

## test.todo

- **Alias:** `it.todo`

Use `test.todo` to stub tests to be implemented later. An entry will be shown in the report for the tests so you know how many tests you still need to implement.

```ts
// An entry will be shown in the report for this test
test.todo('unimplemented test', () => {
  // failing implementation...
})
```

::: tip
Vitest will automatically mark test as `todo` if test has no body.
:::

<!-- Source: https://vitest.dev/api/test | docs/api/test.md | section: ## test.fails -->

## test.fails

- **Alias:** `it.fails`

Use `test.fails` to indicate that an assertion will fail explicitly.

```ts
import { expect, test } from 'vitest'

test.fails('repro #1234', () => {
  expect(add(1, 2)).toBe(4)
})
```

This flag is useful to track difference in behaviour of your library over time. For example, you can define a failing test without fixing the issue yet due to time constraints. Tests marked with `fails` are tracked in the test summary since Vitest 4.1.

<!-- Source: https://vitest.dev/guide/test-annotations | docs/guide/test-annotations.md -->

# Test Annotations

Vitest supports annotating your tests with custom messages and files via the [`context.annotate`](/guide/test-context#annotate) API. These annotations will be attached to the test case and passed down to reporters in the [`onTestAnnotate`](/api/advanced/reporters#ontestannotate) hook.

```ts
test('hello world', async ({ annotate }) => {
  await annotate('this is my test')

  if (condition) {
    await annotate('this should\'ve errored', 'error')
  }

  const file = createTestSpecificFile()
  await annotate('creates a file', { body: file })

  await annotate('creates a file with text', {
    contentType: 'text/markdown',
    body: 'Hello **markdown**',
    bodyEncoding: 'utf-8',
  })
})
```

::: warning
The `annotate` function returns a Promise, so it needs to be awaited if you rely on it somehow. However, Vitest will also automatically await any non-awaited annotation before the test finishes.
:::

Depending on your reporter, you will see these annotations differently.

## Built-in Reporters

### default

The `default` reporter prints annotations only if the test has failed:

```
  ⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

  FAIL  example.test.js > an example of a test with annotation
Error: thrown error
  ❯ example.test.js:11:21
      9 |    await annotate('annotation 1')
      10|    await annotate('annotation 2', 'warning')
      11|    throw new Error('thrown error')
        |          ^
      12|  })

  ❯ example.test.js:9:15 notice
    ↳ annotation 1
  ❯ example.test.js:10:15 warning
    ↳ annotation 2

  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯
```

### verbose

The `verbose` reporter is the only terminal reporter that reports annotations when the test doesn't fail.

```
✓ example.test.js > an example of a test with annotation

  ❯ example.test.js:9:15 notice
    ↳ annotation 1
  ❯ example.test.js:10:15 warning
    ↳ annotation 2

```

### html

The HTML reporter shows annotations the same way the UI does. You can see the annotation on the line where it was called. At the moment, if the annotation wasn't called in a test file, you cannot see it in the UI. We are planning to support a separate test summary view where it will be visible.

<img alt="Vitest UI" img-light src="/annotations-html-light.png">
<img alt="Vitest UI" img-dark src="/annotations-html-dark.png">

### junit

The `junit` reporter lists annotations inside the testcase's `properties` tag. The JUnit reporter will ignore all attachments and will print only the type and the message.

```xml
<testcase classname="basic/example.test.js" name="an example of a test with annotation" time="0.14315">
    <properties>
        <property name="notice" value="the message of the annotation">
        </property>
    </properties>
</testcase>
```

### github-actions

The `github-actions` reporter will print the annotation as a [notice message](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/workflow-commands-for-github-actions#setting-a-notice-message) by default. You can configure the `type` by passing down the second argument as `notice`, `warning` or `error`. If type is none of these, Vitest will show the message as a notice.

<img alt="GitHub Actions" img-light src="/annotations-gha-light.png">
<img alt="GitHub Actions" img-dark src="/annotations-gha-dark.png">

### tap

The `tap` and `tap-flat` reporters print annotations as diagnostic messages on a new line starting with a `#` symbol. They will ignore all attachments and will print only the type and message:

```
ok 1 - an example of a test with annotation # time=143.15ms
    # notice: the message of the annotation
```
