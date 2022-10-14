import asyncNoAwaitRule from './rules/async-no-await';

module.exports = {
  rules: {
    'async-no-await': {
      create: asyncNoAwaitRule,
    },
  },
};
