import { ERROR_NO_FILES } from './config';
import { getIn } from './lib/get-in';

export default {
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
    const files = { ...getIn('options.0.files', context) };
    const rootDir = getIn('options.0.rootDir', context, process.cwd());
    const fileCount = Object.keys(files).length;

    if (fileCount === 0) {
      return {
        'Program:exit'(node) {
          context.report({
            message: ERROR_NO_FILES,
            node
          });
        }
      };
    }
    return {};
  }
};
