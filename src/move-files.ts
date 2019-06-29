import { Rule } from 'eslint';
import * as EsTree from 'estree';
import { moveSync } from 'fs-extra';
import { dirname, relative, resolve } from 'path';
import { ERROR_MOVED_FILE } from './config';
import { getIn } from './lib/get-in';

const rule: Rule.RuleModule = {
  meta: {
    docs: {
      category: 'Stylistic Issues',
      description: 'Move files around while keeping imports up to date',
      recommended: false
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        required: ['files'],
        additionalProperties: false,
        properties: {
          files: {
            type: 'object',
            patternProperties: { '^.*$': { anyOf: [{ type: 'string' }] } },
            additionalProperties: false
          }
        }
      }
    ]
  },
  create: (context) => {
    const files = getIn('options.0.files', context, {});
    const currentFilePath = context.getFilename();
    const dirPath = dirname(currentFilePath);

    const withLeadingDot = (moduleId: string) =>
      moduleId.startsWith('.') ? moduleId : `./${moduleId}`;

    const withoutFileExtension = (filePath: string) =>
      filePath.replace(/\.[^.]+$/, '');

    const getNewModuleId = (newPath: string) =>
      withLeadingDot(withoutFileExtension(relative(dirPath, newPath)));

    const withFileExtension = (filePath: string) => {
      try {
        return require.resolve(filePath);
      } catch (e) {
        return filePath;
      }
    };

    return {
      'CallExpression[callee.name="require"][arguments.0.value=/^\\./]'(
        n: EsTree.Node
      ) {
        const node = n as any;
        const moduleId = node.arguments[0].value;
        const quotes = node.arguments[0].raw.charAt(0);
        const modulePath = withFileExtension(resolve(dirPath, moduleId));
        const newModulePath = files[modulePath];
        if (newModulePath) {
          const newModuleId = getNewModuleId(newModulePath);
          const withQuotes = `${quotes}${newModuleId}${quotes}`;
          context.report({
            fix: (fixer) => fixer.replaceText(node.arguments[0], withQuotes),
            message: ERROR_MOVED_FILE(modulePath, newModulePath),
            node
          });
        }
      },
      'ImportDeclaration[source.value=/^\\./]'(n: EsTree.Node) {
        const node = n as any;
        const moduleId = node.source.value;
        const quotes = node.source.raw.charAt(0);
        const modulePath = withFileExtension(resolve(dirPath, moduleId));
        const newModulePath = files[modulePath];
        if (newModulePath) {
          const newModuleId = getNewModuleId(newModulePath);
          const withQuotes = `${quotes}${newModuleId}${quotes}`;
          context.report({
            fix: (fixer) => fixer.replaceText(node.source, withQuotes),
            message: ERROR_MOVED_FILE(modulePath, newModulePath),
            node
          });
        }
      },
      'Program:exit'(n: EsTree.Node) {
        const node = n as EsTree.Program;
        const newFilePath = files[currentFilePath];
        if (newFilePath) {
          context.report({
            fix(fixer) {
              moveSync(currentFilePath, newFilePath, { overwrite: true });
              return fixer.insertTextAfter(node, '');
            },
            message: ERROR_MOVED_FILE(currentFilePath, newFilePath),
            node
          });
        }
      }
    };
  }
};

export default rule;
