import { RuleListener, RuleModule } from "@typescript-eslint/utils/ts-eslint";
import asyncNoAwaitRule from "./rules/async-no-await";
import unnecessaryAsync from "./rules/unnecessary-async";

const configuration: {
  rules: {
    "async-no-await": RuleModule<
      "noAwaitBeforeReturnPromise" | "asyncCallNoAwait",
      never[],
      RuleListener
    >;
    "unnecessary-async": RuleModule<"unnecessaryAsync", never[], RuleListener>;
  };
} = {
  rules: {
    "async-no-await": asyncNoAwaitRule,
    "unnecessary-async": unnecessaryAsync,
  },
};

export = configuration;
