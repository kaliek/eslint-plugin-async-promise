import { ESLintUtils } from "@typescript-eslint/utils";
import rule from "../rules/async-no-await";
const ruleTester = new ESLintUtils.RuleTester({
  parser: "@typescript-eslint/parser",
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: "./tsconfig.json",
  },
});
ruleTester.run("async-no-await", rule, {
  valid: [
    `function a() {
        return Promise.resolve();
      };
    async function b() {
      await a();
      return Promise.resolve();
    };`,
    `function a() {
      return Promise.resolve();
    };
    function b() {
      a();
      return Promise.resolve();
    };`,
    `function a() {
      return Promise.resolve();
    };
    async function b() {
      return a();
    };`,
  ],
  invalid: [
    {
      code: `
      function a() {
        return Promise.resolve();
      };
      async function b() {
        a();
        return Promise.resolve();
      };
      `,
      errors: [{ messageId: "noAwaitBeforeReturnPromise" }, { messageId: "asyncCallNoAwait"}],
    },
    {
      code: `
      function a() {
        return Promise.resolve();
      };
      async function b() {
        a();
        return 'Not returning a Promise';
      };`,
      errors: [{ messageId: "noAwaitBeforeReturnPromise" }, { messageId: "asyncCallNoAwait"}],
    },
    {
      code: `
      function c() {
        return Promise.resolve();
      };
      async function d() {
        const result = c();
        return result;
      };`,
      errors: [{ messageId: "noAwaitBeforeReturnPromise" }, { messageId: "asyncCallNoAwait"}],
    },
    {
      code: `
      function a() {
        return Promise.resolve();
      };
      async function b() {
        a().then(() => {});
        return Promise.resolve();
      };
      `,
      errors: [{ messageId: "noAwaitBeforeReturnPromise" }, { messageId: "asyncCallNoAwait"}],
    },
  ],
});
