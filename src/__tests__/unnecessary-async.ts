import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../rules/unnecessary-async";

const ruleTester = new RuleTester({
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
    `function a() {
        return Promise.resolve();
      };
      async function b() {
        return a();
      };`,
    `const a = {
        b: () => Promise.resolve(),
      };
      async function c() {
        const result = await a.b();
        return result;
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
      errors: [{ messageId: "unnecessaryAsync" }],
    },
  ],
});
