import { ESLintUtils } from "@typescript-eslint/utils";
import rule from "../rules/unnecessary-async";
const ruleTester = new ESLintUtils.RuleTester({
  parser: "@typescript-eslint/parser",
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: "./tsconfig.json",
  },
});
ruleTester.run("unnecessary-async", rule, {
  valid: [
    `
    async function b() {
      return Promise.resolve();
    };`,
    `function a() {
      return Promise.resolve();
    };
    async function b() {
      await a();
    };`,
  ],
  invalid: [
    {
      code: `
      async function b() {
        return 'Not returning a Promise explicitly';
      };
      `,
      errors: [{ messageId: "unnecessaryAsync" }],
    },
    {
      code: `
      function a() {
        return Promise.resolve();
      };
      async function b() {
        a();
      };`,
      errors: [
        { messageId: "unnecessaryAsync" },
      ],
    },
  ],
});
