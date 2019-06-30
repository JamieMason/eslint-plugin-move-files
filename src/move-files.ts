import { Rule } from 'eslint';
import * as EsTree from 'estree';
import { outputFileSync, removeSync } from 'fs-extra';
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
    const sourceCode = context.getSourceCode();
    const files = getIn('options.0.files', context, {});
    const currentFilePath = context.getFilename();
    const dirPath = dirname(currentFilePath);
    const newFilePath = files[currentFilePath];
    const isFileBeingMoved = Boolean(newFilePath);

    const withLeadingDot = (moduleId: string) =>
      moduleId.startsWith('.') || moduleId.startsWith('/')
        ? moduleId
        : `./${moduleId}`;

    const withoutFileExtension = (filePath: string) =>
      filePath.replace(/\.[^.]+$/, '');

    const getNewModuleId = (xx: string) =>
      withLeadingDot(withoutFileExtension(xx));

    const withFileExtension = (filePath: string) => {
      try {
        return require.resolve(filePath);
      } catch (e) {
        return `${filePath}.js`;
      }
    };

    if (isFileBeingMoved) {
      const fixes: Array<(fixer: Rule.RuleFixer) => Rule.Fix> = [];
      return {
        ImportDeclaration(n: EsTree.Node) {
          const node = n as any;
          const moduleId = node.source.value;
          if (!moduleId.startsWith('.')) {
            return;
          }
          const newDirPath = dirname(newFilePath);
          if (dirPath !== newDirPath) {
            const quotes = node.source.raw.charAt(0);
            const modulePath = withFileExtension(resolve(dirPath, moduleId));
            const newPathToModule = relative(newDirPath, modulePath);
            const newModuleId = getNewModuleId(newPathToModule);
            const withQuotes = `${quotes}${newModuleId}${quotes}`;
            fixes.push((fixer) => fixer.replaceText(node.source, withQuotes));
          }
        },
        'Program:exit'(n: EsTree.Node) {
          const node = n as EsTree.Program;
          return context.report({
            fix(fixer) {
              const contents = sourceCode.getText();
              process.nextTick(() => removeSync(currentFilePath));
              outputFileSync(newFilePath, contents);
              // ESLint's types don't reflect that an array of fixes can be returned
              return (fixes.map((fn) => fn(fixer)) as unknown) as Rule.Fix;
            },
            message: ERROR_MOVED_FILE(currentFilePath, newFilePath),
            node
          });
        }
      };
    }

    return {
      'CallExpression[callee.name="require"]'(n: EsTree.Node) {
        const node = n as any;
        const moduleId = getIn('arguments.0.value', node, '');
        if (!moduleId.startsWith('.')) {
          return;
        }
        const quotes = node.arguments[0].raw.charAt(0);
        const modulePath = withFileExtension(resolve(dirPath, moduleId));
        const newModulePath = files[modulePath];
        if (newModulePath) {
          const newModuleId = getNewModuleId(relative(dirPath, newModulePath));
          const withQuotes = `${quotes}${newModuleId}${quotes}`;
          return context.report({
            fix: (fixer) => fixer.replaceText(node.arguments[0], withQuotes),
            message: ERROR_MOVED_FILE(modulePath, newModulePath),
            node: node.arguments[0]
          });
        }
      },
      ImportDeclaration(n: EsTree.Node) {
        const node = n as any;
        const moduleId = node.source.value;
        if (!moduleId.startsWith('.')) {
          return;
        }
        const quotes = node.source.raw.charAt(0);
        const modulePath = withFileExtension(resolve(dirPath, moduleId));
        const newModulePath = files[modulePath];
        if (newModulePath) {
          const newModuleId = getNewModuleId(relative(dirPath, newModulePath));
          const withQuotes = `${quotes}${newModuleId}${quotes}`;
          return context.report({
            fix: (fixer) => fixer.replaceText(node.source, withQuotes),
            message: ERROR_MOVED_FILE(modulePath, newModulePath),
            node: node.source
          });
        }
      }
    };
  }
};

export default rule;
