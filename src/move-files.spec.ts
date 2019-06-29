import { existsSync } from 'fs';
import * as mock from 'mock-fs';
import rule from './move-files';
import { ruleTester } from './test/rule-tester';

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
  const rootDir = '/fake/dir';
  const oldName = 'old-name.js';
  const newName = 'new-name.js';
  const oldPath = `${rootDir}/${oldName}`;
  const newPath = `${rootDir}/${newName}`;
  const fileContents = 'export const a = 1;';

  describe('when file already has the new name', () => {
    it('is valid', () => {
      ruleTester.run('move-files', rule, {
        valid: [
          {
            code: '',
            filename: newPath,
            options: [{ files: { [oldPath]: newPath }, rootDir }]
          }
        ],
        invalid: []
      });
    });
  });

  describe('when file has the old name', () => {
    it('renames the file', () => {
      const message = `${oldPath} has moved to ${newPath}`;
      mock({ [rootDir]: { [oldName]: fileContents } });

      ruleTester.run('move-files', rule, {
        valid: [],
        invalid: [
          {
            code: fileContents,
            errors: [{ message }],
            filename: oldPath,
            options: [{ files: { [oldPath]: newPath }, rootDir }]
          }
        ]
      });

      expect(existsSync(newPath)).toEqual(true);
      mock.restore();
    });
  });
});
