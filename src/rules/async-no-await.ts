import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import * as tsutils from 'tsutils';
import type * as ts from 'typescript';
import * as utils from '../utils';

interface ScopeInfo {
  upper: ScopeInfo | null;
  hasAsync: boolean;
  returnsPromise: boolean;
  noAwaitCalls: string[];
}
type FunctionNode =
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | TSESTree.ArrowFunctionExpression;

const rule = ESLintUtils.RuleCreator.withoutDocs({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Check missing await for async calls inside async functions which return Promise',
      recommended: 'error',
      requiresTypeChecking: true,
    },
    messages: {
      noAwaitBeforeReturnPromise:
        'Inside this async function which returns Promise, these async functions: [{{noAwaitCalls}}] do not have `await`',
      asyncCallNoAwait:
        'This async function is not `await`ed, it will be executed synchoronously with the returning Promise',
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

      // console.log({name: node.id?.name, scopeInfo, upper: scopeInfo.upper});
      if (
        node.async &&
        scopeInfo.returnsPromise &&
        scopeInfo.noAwaitCalls.length > 0
      ) {
        context.report({
          node,
          loc: utils.getFunctionHeadLoc(node, sourceCode),
          messageId: 'noAwaitBeforeReturnPromise',
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
     * Marks the current scope as having an await
     */
    function markAsReturnsPromise(): void {
      if (!scopeInfo) {
        return;
      }
      scopeInfo.returnsPromise = true;
    }

    /**
     * Marks the current scope as having an await
     */
    function addNoAwaitCalls(node: TSESTree.CallExpression): void {
      if (!scopeInfo) {
        return;
      }
      const callee = node.callee as TSESTree.Identifier;
      scopeInfo.noAwaitCalls.push(
        `${callee.name}(line: ${callee.loc.start.line})`
      );
      context.report({
        node,
        loc: callee.loc,
        messageId: 'asyncCallNoAwait',
      });
    }

    return {
      FunctionDeclaration: enterFunction,
      FunctionExpression: enterFunction,
      ArrowFunctionExpression: enterFunction,
      'FunctionDeclaration:exit': exitFunction,
      'FunctionExpression:exit': exitFunction,
      'ArrowFunctionExpression:exit': exitFunction,

      // check body-less async arrow function.
      // ignore `async () => await foo` because it's obviously correct
      'ArrowFunctionExpression[async = true] > :not(BlockStatement, AwaitExpression)'(
        node: Exclude<
          TSESTree.Node,
          TSESTree.BlockStatement | TSESTree.AwaitExpression
        >
      ): void {
        const expression = parserServices.esTreeNodeToTSNodeMap.get(node);
        if (expression && isThenableType(expression)) {
          markAsReturnsPromise();
        }
      },
      ReturnStatement(node): void {
        // short circuit early to avoid unnecessary type checks
        if (!scopeInfo || !scopeInfo.hasAsync) {
          return;
        }

        const { expression } = parserServices.esTreeNodeToTSNodeMap.get(node);
        if (expression && isThenableType(expression)) {
          markAsReturnsPromise();
        }
      },
      ExpressionStatement(node): void {
        // short circuit early to avoid unnecessary type checks
        if (!scopeInfo || !scopeInfo.hasAsync) {
          return;
        }

        const { expression } = parserServices.esTreeNodeToTSNodeMap.get(node);
        if (expression && isThenableType(expression)) {
          if (node.expression.type === 'CallExpression') {
            const callee = node.expression.callee;
            if (callee.type === 'Identifier') {
              addNoAwaitCalls(node.expression);
            }
            if (
              callee.type === 'MemberExpression' &&
              callee.property.type === 'Identifier'
            ) {
              if (
                callee.property.name !== 'then' &&
                callee.property.name !== 'catch'
              ) {
                if (callee.object.type === 'CallExpression') {
                  addNoAwaitCalls(callee.object);
                }
              }
            }
          }
        }
      },
    };
  },
});

export default rule;
