import { Rule } from 'eslint';
import { DEFAULT_OPTIONS } from './config';
import moveFilesListener from './move-files';

const moveFiles: Rule.RuleModule = {
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
  create: moveFilesListener
};

export = {
  rules: {
    'move-files': moveFiles
  },
  rulesConfig: {
    'move-files': [2, DEFAULT_OPTIONS]
  }
};
