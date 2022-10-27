import { ESLintUtils, TSESTree } from "@typescript-eslint/utils";
import * as tsutils from "tsutils";
import type * as ts from "typescript";
import * as utils from "../utils";

interface ScopeInfo {
  upper: ScopeInfo | null;
  hasAsync: boolean;
  hasAwait: boolean;
  noAwaitCalls: string[];
}
type FunctionNode =
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | TSESTree.ArrowFunctionExpression;

const rule = ESLintUtils.RuleCreator.withoutDocs({
  meta: {
    type: "problem",
    docs: {
      description: "Check missing await for async calls inside async functions",
      recommended: "error",
      requiresTypeChecking: true,
    },
    messages: {
      noAwaitBeforeReturnPromise:
        "Inside this async function, these async functions: [{{noAwaitCalls}}] do not have `await`.",
      asyncCallNoAwait:
        "This async function is not `await`ed, so it would run concurrently with the returning Promise of the outer async function. Please add `await`, or disable the rule if needed."
    },
    schema: [],
  },
  defaultOptions: [],
  create(context: any) {
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
        hasAwait: false,
        noAwaitCalls: [],
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

      if (node.async && scopeInfo.noAwaitCalls.length > 0) {
        context.report({
          node,
          loc: utils.getFunctionHeadLoc(node, sourceCode),
          messageId: "noAwaitBeforeReturnPromise",
          data: {
            noAwaitCalls: scopeInfo.noAwaitCalls,
          },
        });
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
     * Mark the scope as hasAwait, so that CallExpression will early return
     */
    function markAsHasAwait(): void {
      if (!scopeInfo) {
        return;
      }
      scopeInfo.hasAwait = true;
    }
    
    /**
     * Add name and line number string to the list that keeps all problematic calls
     * Report at the location of the async call
     */
    function addNoAwaitCalls(callee: TSESTree.Identifier, node: TSESTree.CallExpression): void {
      if (!scopeInfo) {
        return;
      }
      scopeInfo.noAwaitCalls.push(
        `${callee.name}(line: ${callee.loc.start.line})`
      );
      context.report({
        node,
        loc: callee.loc,
        messageId: "asyncCallNoAwait",
      });
    }

    return {
      FunctionDeclaration: enterFunction,
      FunctionExpression: enterFunction,
      ArrowFunctionExpression: enterFunction,
      "FunctionDeclaration:exit": exitFunction,
      "FunctionExpression:exit": exitFunction,
      "ArrowFunctionExpression:exit": exitFunction,
      AwaitExpression: markAsHasAwait,
      ReturnStatement: markAsHasAwait,
      'ForOfStatement[await = true]': markAsHasAwait,
      'ArrowFunctionExpression[async = true] >  AwaitExpression':markAsHasAwait,
      "BlockStatement CallExpression"(node: TSESTree.CallExpression){
        // short circuit early to avoid unnecessary type checks
        if (!scopeInfo || !scopeInfo.hasAsync) {
          return;
        }

        if (scopeInfo.hasAwait) {
          return;
        }

        const tsnode = parserServices.esTreeNodeToTSNodeMap.get(node);
        if (
          tsnode && isThenableType(tsnode)) {
          const callee = node.callee;
          if (callee.type === "Identifier") {
            addNoAwaitCalls(callee, node);
          }
        }
      },
    };
  },
});

export default rule;
