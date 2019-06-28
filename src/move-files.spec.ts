import { RuleTester } from 'eslint';
import { ERROR_NO_FILES } from './config';
import rule from './move-files';

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaFeatures: { jsx: false },
    ecmaVersion: 8,
    sourceType: 'module'
  }
});

describe('when no files are provided', () => {
  describe('it fails due to invalid rule configuration', () => {
    const expectFileConfigError = (options) =>
      ruleTester.run('move-files', rule.create, {
        valid: [],
        invalid: [{ code: '', errors: [{ message: ERROR_NO_FILES }], options }]
      });

    expectFileConfigError([]);
    expectFileConfigError([{ files: null }]);
    expectFileConfigError([{ files: {} }]);
  });
});
