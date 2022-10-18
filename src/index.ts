import asyncNoAwaitRule from './rules/async-no-await';
import unnecessaryAsync from './rules/unnecessary-async';

const configuration = {
  rules: {
    'async-no-await': asyncNoAwaitRule,
    'unnecessary-async': unnecessaryAsync
  },
};

export = configuration;