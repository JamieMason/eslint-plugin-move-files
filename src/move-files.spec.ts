import { existsSync, readFileSync } from 'fs';
import * as mock from 'mock-fs';
import { resolve } from 'path';
import { ERROR_FLAT_DIRECTORY, ERROR_MULTIPLE_TARGETS } from './config';
import rule from './move-files';
import { ruleTester } from './test/rule-tester';

const readTextFileSync = (filePath: string) =>
  readFileSync(filePath, { encoding: 'utf8' });

beforeAll(() => {
  console.log('https://github.com/tschaub/mock-fs/issues/234');
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
  const oldPath = `./fake/dir/old-name.js`;
  const newPath = `./fake/dir/new-name.js`;
  const fileContents = `import { dep } from './dep'; export const a = 1;`;
  const errors = [{ message: `${oldPath} has moved to ${newPath}` }];
  const options = [{ files: { [oldPath]: './new-name.js' } }];

  describe('when file already has the new name', () => {
    it('is valid', () => {
      ruleTester.run('move-files', rule, {
        valid: [{ code: '', filename: resolve(newPath), options }],
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

    it('renames the file', (done) => {
      ruleTester.run('move-files', rule, {
        valid: [],
        invalid: [
          {
            code: fileContents,
            errors,
            filename: resolve(oldPath),
            options
          }
        ]
      });

      process.nextTick(() => {
        expect(existsSync(oldPath)).toEqual(false);
        expect(readTextFileSync(newPath)).toEqual(fileContents);
        done();
      });
    });

    it('updates imports to the renamed file', () => {
      ruleTester.run('move-files', rule, {
        valid: [
          {
            code: `import { a } from './new-name';`,
            filename: resolve(`./fake/dir/sibling.js`)
          },
          {
            code: `import { a } from '../new-name';`,
            filename: resolve(`./fake/dir/dir/child.js`)
          },
          {
            code: `import { a } from './fake/dir/new-name';`,
            filename: resolve(`./parent.js`)
          }
        ],
        invalid: [
          {
            code: `import { a } from './old-name';`,
            filename: resolve(`./fake/dir/sibling.js`),
            output: `import { a } from './new-name';`
          },
          {
            code: `import { a } from '../old-name';`,
            filename: resolve(`./fake/dir/dir/child.js`),
            output: `import { a } from '../new-name';`
          },
          {
            code: `import { a } from './fake/dir/old-name';`,
            filename: resolve(`./parent.js`),
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
            filename: resolve(`./fake/dir/sibling.js`),
            output: `const { a } = require('./new-name');`
          },
          {
            code: `const { a } = require('../old-name');`,
            filename: resolve(`./fake/dir/dir/child.js`),
            output: `const { a } = require('../new-name');`
          },
          {
            code: `const { a } = require('./fake/dir/old-name');`,
            filename: resolve(`./parent.js`),
            output: `const { a } = require('./fake/dir/new-name');`
          }
        ].map((spec) => ({ ...spec, errors, options }))
      });
    });
  });
});

[
  {
    consumer: ['./consumer.js', './fake/old-dir/file', './fake/new-dir/file'],
    dependency: ['./dep', '../old-dir/dep'],
    filePath: [`./fake/old-dir/file.js`, `./fake/new-dir/file.js`],
    target: '../new-dir/file.js'
  },
  {
    consumer: ['./fake/dir/lib/consumer.js', '../../file', '../../lib/file'],
    dependency: ['./lib/dep', './dep'],
    filePath: [`./fake/file.js`, `./fake/lib/file.js`],
    target: './lib/file.js'
  },
  {
    consumer: ['./fake/old-dir/consumer.js', './name', '../new-dir/name'],
    dependency: ['../../dep', '../../dep'],
    filePath: [`./fake/old-dir/name.js`, `./fake/new-dir/name.js`],
    target: '../new-dir/name.js'
  },
  {
    consumer: ['./fake/new-dir/consumer.js', '../old-dir/file', '../../file'],
    dependency: ['./dep', './fake/old-dir/dep'],
    filePath: [`./fake/old-dir/file.js`, `./file.js`],
    target: '../../file.js'
  }
].forEach(
  ({
    consumer: [consumerPath, inId, newInId],
    dependency: [outId, newOutId],
    filePath: [oldPath, newPath],
    target
  }) => {
    describe(`when moving one file from ${oldPath} to ${newPath}`, () => {
      const options = [{ files: { [oldPath]: target } }];
      const errors = [{ message: `${oldPath} has moved to ${newPath}` }];
      const consumerContents = `
        import lodash from 'lodash';
        import { a } from '${inId}';
      `.trim();
      const newConsumerContents = `
        import lodash from 'lodash';
        import { a } from '${newInId}';
      `.trim();
      const fileContents = `
        import ramda from 'ramda';
        import { dep } from '${outId}';
        export const a = 1;
      `.trim();
      const newFileContents = `
        import ramda from 'ramda';
        import { dep } from '${newOutId}';
        export const a = 1;
      `.trim();

      describe('when file has already been moved', () => {
        it('is valid', () => {
          ruleTester.run('move-files', rule, {
            valid: [{ code: '', filename: resolve(newPath), options }],
            invalid: []
          });
        });
      });

      describe('when file is in the old location', () => {
        beforeEach(() => {
          mock({ [oldPath]: fileContents });
        });

        afterEach(() => {
          mock.restore();
        });

        it('moves the file and updates its imports', (done) => {
          ruleTester.run('move-files', rule, {
            valid: [],
            invalid: [
              {
                code: fileContents,
                errors,
                filename: resolve(oldPath),
                options,
                output: newFileContents
              },
              {
                code: consumerContents,
                errors,
                filename: resolve(consumerPath),
                options,
                output: newConsumerContents
              }
            ]
          });

          process.nextTick(() => {
            // ESLint's RuleTester does not write to Disk, but we can assert that:
            // 1. The File in its old location had its imports updated (via the
            //    `output` property above).
            // 2. A file was written in the new location containing the *old*
            //    contents, in reality this would be the new contents with the
            //    updated imports.
            expect(existsSync(resolve(oldPath))).toEqual(false);
            expect(readTextFileSync(resolve(newPath))).toEqual(fileContents);
            done();
          });
        });
      });
    });
  }
);

describe('when moving a glob pattern of multiple files', () => {
  const source = './fake/dir/**/*.js';
  describe('when target is another glob pattern', () => {
    it('throws because it is not clear what to do with them', () => {
      ['./fake/other-dir/**/*.js', './**/*.js'].forEach((target: string) => {
        expect(() => {
          ruleTester.run('move-files', rule, {
            valid: [],
            invalid: [
              {
                code: '',
                errors: [],
                options: [{ files: { [source]: target } }]
              }
            ]
          });
        }).toThrowError(ERROR_MULTIPLE_TARGETS(source, target));
      });
    });
  });

  describe('when target is an absolute path to a directory', () => {
    it('throws because this feature is not implemented', () => {
      ['/fake/other-dir', '/fake/other-dir/'].forEach((target: string) => {
        expect(() => {
          ruleTester.run('move-files', rule, {
            valid: [],
            invalid: [
              {
                code: '',
                errors: [],
                options: [{ files: { [source]: target } }]
              }
            ]
          });
        }).toThrowError(ERROR_FLAT_DIRECTORY(source, target));
      });
    });
  });

  describe('when target is a relative path to a directory', () => {
    const target = './nested';
    const changes = [
      {
        filePath: ['./fake/dir/file-a.js', './fake/dir/nested/file-a.js'],
        contents: [
          `
          import { b } from './b/file-b';
          import { c } from './b/c/file-c';
          export const a = 1;
          `,
          `
          import { b } from '../b/nested/file-b';
          import { c } from '../b/c/nested/file-c';
          export const a = 1;
          `
        ]
      },
      {
        filePath: ['./fake/dir/b/file-b.js', './fake/dir/b/nested/file-b.js'],
        contents: [
          `
          import { a } from '../file-a';
          import { c } from './c/file-c';
          export const b = 2;
          `,
          `
          import { a } from '../../nested/file-a';
          import { c } from '../c/nested/file-c';
          export const b = 2;
          `
        ]
      },
      {
        filePath: [
          './fake/dir/b/c/file-c.js',
          './fake/dir/b/c/nested/file-c.js'
        ],
        contents: [
          `
          import { a } from '../../file-a';
          import { b } from '../file-b';
          export const c = 3;
          `,
          `
          import { a } from '../../../nested/file-a';
          import { b } from '../../nested/file-b';
          export const c = 3;
          `
        ]
      }
    ];

    beforeEach(() => {
      mock({
        [changes[0].filePath[0]]: changes[0].contents[0],
        [changes[1].filePath[0]]: changes[1].contents[0],
        [changes[2].filePath[0]]: changes[2].contents[0]
      });
    });

    afterEach(() => {
      mock.restore();
    });

    it('moves each file to the target directory relative to itself', (done) => {
      ruleTester.run('move-files', rule, {
        valid: [],
        invalid: changes.map(({ contents, filePath }) => ({
          code: contents[0],
          errors: [{ message: `${filePath[0]} has moved to ${filePath[1]}` }],
          filename: resolve(filePath[0]),
          options: [{ files: { [source]: target } }],
          output: contents[1]
        }))
      });

      process.nextTick(() => {
        // ESLint's RuleTester does not write to Disk, but we can assert that:
        // 1. The File in its old location had its imports updated (via the
        //    `output` property above).
        // 2. A file was written in the new location containing the *old*
        //    contents, in reality this would be the new contents with the
        //    updated imports.
        changes.forEach(({ contents, filePath }) => {
          expect(existsSync(resolve(filePath[0]))).toEqual(false);
          expect(readTextFileSync(resolve(filePath[1]))).toEqual(contents[0]);
        });
        done();
      });
    });
  });

  describe('when target is a relative path to a file', () => {
    const target = './nested/new-file.js';
    const changes = [
      {
        filePath: ['./fake/dir/file-a.js', './fake/dir/nested/new-file.js'],
        contents: [
          `
          import { b } from './b/file-b';
          import { c } from './b/c/file-c';
          export const a = 1;
          `,
          `
          import { b } from '../b/nested/new-file';
          import { c } from '../b/c/nested/new-file';
          export const a = 1;
          `
        ]
      },
      {
        filePath: ['./fake/dir/b/file-b.js', './fake/dir/b/nested/new-file.js'],
        contents: [
          `
          import { a } from '../file-a';
          import { c } from './c/file-c';
          export const b = 2;
          `,
          `
          import { a } from '../../nested/new-file';
          import { c } from '../c/nested/new-file';
          export const b = 2;
          `
        ]
      },
      {
        filePath: [
          './fake/dir/b/c/file-c.js',
          './fake/dir/b/c/nested/new-file.js'
        ],
        contents: [
          `
          import { a } from '../../file-a';
          import { b } from '../file-b';
          export const c = 3;
          `,
          `
          import { a } from '../../../nested/new-file';
          import { b } from '../../nested/new-file';
          export const c = 3;
          `
        ]
      }
    ];

    beforeEach(() => {
      mock({
        [changes[0].filePath[0]]: changes[0].contents[0],
        [changes[1].filePath[0]]: changes[1].contents[0],
        [changes[2].filePath[0]]: changes[2].contents[0]
      });
    });

    afterEach(() => {
      mock.restore();
    });

    it('moves each file to the target location relative to itself', (done) => {
      ruleTester.run('move-files', rule, {
        valid: [],
        invalid: changes.map(({ contents, filePath }) => ({
          code: contents[0],
          errors: [{ message: `${filePath[0]} has moved to ${filePath[1]}` }],
          filename: resolve(filePath[0]),
          options: [{ files: { [source]: target } }],
          output: contents[1]
        }))
      });

      process.nextTick(() => {
        // ESLint's RuleTester does not write to Disk, but we can assert that:
        // 1. The File in its old location had its imports updated (via the
        //    `output` property above).
        // 2. A file was written in the new location containing the *old*
        //    contents, in reality this would be the new contents with the
        //    updated imports.
        changes.forEach(({ contents, filePath }) => {
          expect(existsSync(resolve(filePath[0]))).toEqual(false);
          expect(readTextFileSync(resolve(filePath[1]))).toEqual(contents[0]);
        });
        done();
      });
    });
  });
});
