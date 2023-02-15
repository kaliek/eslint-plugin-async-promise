# eslint-plugin-async-promise

A typescript-eslint plugin to catch Promise related errors

- [Installation](#installation)
- [Usage](#usage)
- [Rules](#rules)
  - [Rules/async-no-await](#async-no-await)
  - [Rules/unnecessary-async](#unnecessary-async)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation

First, install the required packages for [ESLint](https://eslint.org), [TypeScript](https://typescriptlang.org), [TypeScript ESLint](https://typescript-eslint.io/) and the [TypeScript ESLint Parser](https://github.com/typescript-eslint/typescript-eslint/tree/main/packages/parser)

```bash npm2yarn
npm install @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint typescript --save-dev
```

Next, install `eslint-plugin-async-promise`:

```
$ npm install eslint-plugin-async-promise --save-dev
```

**Note:** If you installed ESLint globally (using the `-g` flag) then you must
also install `eslint-plugin-async-promise` globally.

## Usage

Add `async-promise` to the plugins section of your `.eslintrc.json` configuration
file. You can omit the `eslint-plugin-` prefix:

```json
{
  "plugins": ["async-promise"]
}
```

Then configure the rules you want to use under the rules section.

```json
{
  "rules": {
    "async-promise/async-no-await": "error",
    "async-promise/unnecessary-async": "warn"
  }
}
```

## Rules

### async-no-await

Disallow concurrent async function calls inside an async function.

While we do not always need to `await` Promise (such as firing side-effects that do not block other calls), it is often a programmer error to forget adding `await` for these async callsinside an async function.

#### Examples

<!--tabs-->

#### ❌ Incorrect

```ts
function a() {
  return Promise.resolve();
}
async function b() {
  a(); // a() should have been awaited
  return Promise.resolve();
}
```

```ts
function a() {
  return Promise.resolve();
}
async function b() {
  a(); // a() should have been awaited since the return type is still Promise implicitly
  return "Not returning a Promise";
}
```

#### ✅ Correct

```ts
function a() {
  return Promise.resolve();
}
async function b() {
  await a(); // Even if b() is not awaited, a() will always run before the return
  return Promise.resolve();
}
```

```ts
function a() {
    return Promise.resolve();
};
function b() {
    a(); // This is ok because the function is not marked as async, this can just be a side-effect
    return Promise.resolve();
};,
```

```ts
function a() {
  return Promise.resolve();
}
async function b() {
  const result = await Promise.all([a()]); // Skip checks async calls in Promise.all, if it's awaited
  return Promise.resolve();
}
```

### unnecessary-async

Enforce that `async` keyword is only added when:

1. The function explicitly returns Promise
2. There is at least 1 `await` statement in the function

#### Examples

<!--tabs-->

#### ❌ Incorrect

```ts
function a() {
  return Promise.resolve();
}
async function b() {
  a();
}
```

```ts
async function b() {
  return "Not returning a Promise explicitly";
}
```

#### ✅ Correct

```ts
async function b() {
  return Promise.resolve();
}
```

```ts
function a() {
    return Promise.resolve();
};
async function b() {
  await a();
};,
```

```ts
function a() {
    return Promise.resolve();
};
async function b() {
  return a();
};,
```

```ts
const a = {
  b: () => Promise.resolve(),
};
async function c() {
  // Example: MemberExpression : a.b()
  const result = await a.b();
  return result;
}
```
