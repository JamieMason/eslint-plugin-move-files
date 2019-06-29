import { readFileSync } from 'fs';
import * as mock from 'mock-fs';
import rule from './move-files';
import { ruleTester } from './test/rule-tester';

beforeAll(() => {
  console.log('https://github.com/facebook/jest/issues/5792');
});

describe('when no files are provided', () => {
  [[{ files: null }]].forEach((options: any) => {
    it(`fails when options are: ${JSON.stringify(options)}`, () => {
      expect(() => {
        ruleTester.run('move-files', rule, {
          valid: [],
          invalid: [{ code: '', errors: [], options }]
        });
      }).toThrowError();
    });
  });
});

describe('when renaming one file', () => {
  const oldPath = `/fake/dir/old-name.js`;
  const newPath = `/fake/dir/new-name.js`;
  const fileContents = `
    import { dep } from './dep';
    export const a = 1;
  `;
  const errors = [{ message: `${oldPath} has moved to ${newPath}` }];
  const options = [{ files: { [oldPath]: newPath } }];

  describe('when file already has the new name', () => {
    it('is valid', () => {
      ruleTester.run('move-files', rule, {
        valid: [{ code: '', filename: newPath, options }],
        invalid: []
      });
    });
  });

  describe('when file has the old name', () => {
    beforeEach(() => {
      mock({ [oldPath]: fileContents });
    });

    afterEach(() => {
      mock.restore();
    });

    it('renames the file', () => {
      ruleTester.run('move-files', rule, {
        valid: [],
        invalid: [
          {
            code: fileContents,
            errors,
            filename: oldPath,
            options
          }
        ]
      });
      const newPathContents = readFileSync(newPath, { encoding: 'utf8' });
      expect(newPathContents).toEqual(fileContents);
    });

    it('updates imports to the renamed file', () => {
      ruleTester.run('move-files', rule, {
        valid: [
          {
            code: `import { a } from './new-name';`,
            filename: `/fake/dir/sibling.js`
          },
          {
            code: `import { a } from '../new-name';`,
            filename: `/fake/dir/dir/child.js`
          },
          {
            code: `import { a } from './fake/dir/new-name';`,
            filename: `/parent.js`
          }
        ],
        invalid: [
          {
            code: `import { a } from './old-name';`,
            filename: `/fake/dir/sibling.js`,
            output: `import { a } from './new-name';`
          },
          {
            code: `import { a } from '../old-name';`,
            filename: `/fake/dir/dir/child.js`,
            output: `import { a } from '../new-name';`
          },
          {
            code: `import { a } from './fake/dir/old-name';`,
            filename: `/parent.js`,
            output: `import { a } from './fake/dir/new-name';`
          }
        ].map((spec) => ({ ...spec, errors, options }))
      });
    });

    it('updates requires to the renamed file', () => {
      ruleTester.run('move-files', rule, {
        valid: [],
        invalid: [
          {
            code: `const { a } = require('./old-name');`,
            filename: `/fake/dir/sibling.js`,
            output: `const { a } = require('./new-name');`
          },
          {
            code: `const { a } = require('../old-name');`,
            filename: `/fake/dir/dir/child.js`,
            output: `const { a } = require('../new-name');`
          },
          {
            code: `const { a } = require('./fake/dir/old-name');`,
            filename: `/parent.js`,
            output: `const { a } = require('./fake/dir/new-name');`
          }
        ].map((spec) => ({ ...spec, errors, options }))
      });
    });
  });
});
