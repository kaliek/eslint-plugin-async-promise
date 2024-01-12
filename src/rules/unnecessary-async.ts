import { ESLintUtils, TSESTree } from "@typescript-eslint/utils";
import * as tsutils from "tsutils";
import type * as ts from "typescript";
import * as utils from "../utils";

interface ScopeInfo {
  upper: ScopeInfo | null;
  hasAsync: boolean;
  returnsPromise: boolean;
  hasAwait: boolean;
}
type FunctionNode =
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | TSESTree.ArrowFunctionExpression;

const rule = ESLintUtils.RuleCreator.withoutDocs({
  meta: {
    type: "problem",
    docs: {
      description: "Suggest to remove `async` when not necessary",
      recommended: "recommended",
      requiresTypeChecking: true,
    },
    messages: {
      unnecessaryAsync:
        "This function is not explicitly returning Promise or has no `await` statement, do you want to remove `async` keyword?",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const parserServices = ESLintUtils.getParserServices(context);
    const checker = parserServices.program.getTypeChecker();
    const sourceCode = context.getSourceCode();
    let scopeInfo: ScopeInfo | null = null;

    /**
     * Push the scope info object to the stack.
     */
    function enterFunction(node: FunctionNode): void {
      scopeInfo = {
        upper: scopeInfo,
        hasAsync: node.async,
        returnsPromise: false,
        hasAwait: false,
      };
    }

    /**
     * Pop the top scope info object from the stack.
     * Also, it reports the function if needed.
     */
    function exitFunction(node: FunctionNode): void {
      /* istanbul ignore if */ if (!scopeInfo) {
        // this shouldn't ever happen, as we have to exit a function after we enter it
        return;
      }

      if (node.async) {
        if (!scopeInfo.returnsPromise && !scopeInfo.hasAwait) {
          context.report({
            node,
            loc: utils.getFunctionHeadLoc(node, sourceCode),
            messageId: "unnecessaryAsync",
          });
        }
      }

      scopeInfo = scopeInfo.upper;
    }

    /**
     * Checks if the node returns a thenable type
     */
    function isThenableType(node: ts.Node): boolean {
      const type = checker.getTypeAtLocation(node);

      return tsutils.isThenableType(checker, node, type);
    }

    /**
     * Marks the current scope as returns Promise explicitly
     */
    function markAsReturnsPromiseExplicitly(): void {
      if (!scopeInfo) {
        return;
      }
      scopeInfo.returnsPromise = true;
    }

    /**
     * Marks the current scope as has at least 1 await
     */
    function markAsHasAwait(): void {
      if (!scopeInfo) {
        return;
      }
      scopeInfo.hasAwait = true;
    }

    return {
      FunctionDeclaration: enterFunction,
      FunctionExpression: enterFunction,
      ArrowFunctionExpression: enterFunction,
      "FunctionDeclaration:exit": exitFunction,
      "FunctionExpression:exit": exitFunction,
      "ArrowFunctionExpression:exit": exitFunction,

      // check body-less async arrow function.
      // ignore `async () => await foo` because it's obviously correct
      "ArrowFunctionExpression[async = true] > :not(BlockStatement, AwaitExpression)"(
        node: Exclude<
          TSESTree.Node,
          TSESTree.BlockStatement | TSESTree.AwaitExpression
        >
      ): void {
        const expression = parserServices.esTreeNodeToTSNodeMap.get(node);
        if (expression && isThenableType(expression)) {
          markAsReturnsPromiseExplicitly();
        }
      },
      ReturnStatement(node): void {
        // short circuit early to avoid unnecessary type checks
        if (!scopeInfo || !scopeInfo.hasAsync) {
          return;
        }

        const { expression } = parserServices.esTreeNodeToTSNodeMap.get(node);
        if (expression && isThenableType(expression)) {
          markAsReturnsPromiseExplicitly();
        }
      },
      CallExpression(node): void {
        // short circuit early to avoid unnecessary type checks
        if (!scopeInfo || !scopeInfo.hasAsync) {
          return;
        }

        const tsnode = parserServices.esTreeNodeToTSNodeMap.get(node);
        if (
          tsnode &&
          isThenableType(tsnode) &&
          node.parent?.type === "AwaitExpression"
        ) {
          markAsHasAwait();
        }
      },
    };
  },
});

export default rule;
