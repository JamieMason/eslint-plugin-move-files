import { existsSync, readFileSync } from 'fs';
import * as mock from 'mock-fs';
import rule from './move-files';
import { ruleTester } from './test/rule-tester';

const readTextFileSync = (filePath: string) =>
  readFileSync(filePath, { encoding: 'utf8' });

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
  const depPath = `/fake/dir/dep.js`;
  const oldPath = `/fake/dir/old-name.js`;
  const newPath = `/fake/dir/new-name.js`;
  const depContents = `
    export const dep = 1;
  `;
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
      mock({
        [depPath]: depContents,
        [oldPath]: fileContents
      });
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

[
  {
    depPath: `/fake/old-dir/dep.js`,
    oldPath: `/fake/old-dir/file.js`,
    newPath: `/fake/new-dir/file.js`,
    moduleId: './dep',
    newModuleId: '../old-dir/dep'
  },
  {
    depPath: `/fake/lib/dep.js`,
    oldPath: `/fake/file.js`,
    newPath: `/fake/lib/file.js`,
    moduleId: './lib/dep',
    newModuleId: './dep'
  },
  {
    depPath: `/dep.js`,
    oldPath: `/fake/old-dir/name.js`,
    newPath: `/fake/new-dir/name.js`,
    moduleId: '../../dep',
    newModuleId: '../../dep'
  },
  {
    depPath: `/fake/old-dir/dep.js`,
    oldPath: `/fake/old-dir/file.js`,
    newPath: `/file.js`,
    moduleId: './dep',
    newModuleId: './fake/old-dir/dep'
  }
].forEach(({ depPath, oldPath, newPath, moduleId, newModuleId }) => {
  describe(`when moving one file from ${oldPath} to ${newPath}`, () => {
    const options = [{ files: { [oldPath]: newPath } }];
    const depContents = `export const dep = 1;`;
    const fileContents = `import { dep } from '${moduleId}'; export const a = 1;`;
    const newFileContents = `import { dep } from '${newModuleId}'; export const a = 1;`;
    const errors = [
      { message: `${oldPath} has moved to ${newPath}` },
      { message: `${oldPath} has moved to ${newPath}` }
    ];

    describe('when file has already been moved', () => {
      it('is valid', () => {
        ruleTester.run('move-files', rule, {
          valid: [{ code: '', filename: newPath, options }],
          invalid: []
        });
      });
    });

    describe('when file is in the old location', () => {
      beforeEach(() => {
        mock({
          [depPath]: depContents,
          [oldPath]: fileContents
        });
      });

      afterEach(() => {
        mock.restore();
      });

      it('moves the file and updates its imports', () => {
        ruleTester.run('move-files', rule, {
          valid: [],
          invalid: [
            {
              code: fileContents,
              errors,
              filename: oldPath,
              options,
              output: newFileContents
            }
          ]
        });
        // ESLint's RuleTester does not write to Disk, but we can assert that:
        // 1. The File in its old location had its imports updated (via the
        //    `output` property above).
        // 2. A file was written in the new location containing the *old*
        //    contents, in reality this would be the new contents with the
        //    updated imports.
        expect(readTextFileSync(newPath)).toEqual(fileContents);
        expect(existsSync(newPath)).toEqual(true);
      });
    });
  });
});
