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
    `function a() {
      return Promise.resolve();
    };
    async function b() {
      return a().then(() => {});
    };`,
    `
    function a() {
      return Promise.resolve();
    }
    async function b() {
      const test = await Promise.all([a(), a()]);
      return test;
    }
    `,
    `
    function a() {
      return Promise.resolve();
    }
    async () => await a();
    `,
    `
    function a() {
      return Promise.resolve();
    }
    async () => {
      const promise = [];
      promise.push(a());
      promise.push(a());
      await Promise.all(promise);
    };
    `,
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
      errors: [
        { messageId: 'noAwaitBeforeReturnPromise' },
        { messageId: 'asyncCallNoAwait' },
      ],
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
      errors: [
        { messageId: 'noAwaitBeforeReturnPromise' },
        { messageId: 'asyncCallNoAwait' },
      ],
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
      errors: [
        { messageId: 'noAwaitBeforeReturnPromise' },
        { messageId: 'asyncCallNoAwait' },
      ],
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
      errors: [
        { messageId: 'noAwaitBeforeReturnPromise' },
        { messageId: 'asyncCallNoAwait' },
      ],
    },
    {
      code: `
      async function b() {
        return Promise.resolve();
      };
      async function d() {
        return Promise.resolve();
      };
      const state = {
        fetchData: async (ouId, treeId) => {
          await d();
          b();
        }
      }`,
      errors: [
        { messageId: 'noAwaitBeforeReturnPromise' },
        { messageId: 'asyncCallNoAwait' },
      ],
    },
    {
      code: `
      async function b() {
        return Promise.resolve();
      };
      async function d() {
        return Promise.resolve();
      };
      async function a() {
        const result = await Promise.all([b(), d()]);
        b();
      }
      `,
      errors: [
        { messageId: 'noAwaitBeforeReturnPromise' },
        { messageId: 'asyncCallNoAwait' },
      ],
    },
  ],
});
