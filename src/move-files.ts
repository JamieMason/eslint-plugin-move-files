import { Rule } from 'eslint';
import { Node } from 'estree';
import { moveSync } from 'fs-extra';
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
          },
          rootDir: { type: 'string' }
        }
      }
    ]
  },
  create: (context) => {
    const files = getIn('options.0.files', context, {});
    const rootDir = getIn('options.0.rootDir', context, process.cwd());
    const oldPath = context.getFilename();
    const newPath = files[oldPath];

    if (newPath) {
      return {
        'Program:exit': (node: Node) =>
          context.report({
            fix(fixer) {
              moveSync(oldPath, newPath, { overwrite: true });
              return fixer.insertTextAfter(node, '');
            },
            message: ERROR_MOVED_FILE(oldPath, newPath),
            node
          })
      };
    }

    return {};
  }
};

export default rule;
