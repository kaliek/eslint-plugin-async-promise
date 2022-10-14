import { ESLintUtils } from '@typescript-eslint/utils';
import rule from '../rules/async-no-await';
const ruleTester = new ESLintUtils.RuleTester({
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.json',
  },
});
ruleTester.run('async-no-await', rule, {
  valid: [
    {
      code: `async function a() {
        return Promise.resolve();
      };
      async function b() {
        a().then(() => {});
        await a();
        return Promise.resolve();
      };`,
    },
  ],
  invalid: [
    {
      code: `async function a() {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve("a");
          }, 1000);
        });
      };
      async function b() {
        a();
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve("b");
          }, 300);
        });
      };`,
      errors: [
        { messageId: 'noAwaitBeforeReturnPromise' },
        { messageId: 'asyncCallNoAwait' },
      ],
    },
  ],
});
