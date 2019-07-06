import { RuleTester } from 'eslint';
import { existsSync, readFileSync } from 'fs';
import * as glob from 'glob';
import * as mock from 'mock-fs';
import { resolve } from 'path';
import rule from './move-files';
import { ruleTester } from './test/rule-tester';

type OldPath = string;
type NewPath = string;
type ConsumerPath = string;
type OldModuleId = string;
type NewModuleId = string;

interface File {
  path: [OldPath, NewPath?];
  consumers: Array<[ConsumerPath, OldModuleId, NewModuleId]>;
  imports: Array<[OldModuleId, NewModuleId]>;
}

type Target = string;

interface TestCase {
  description: string;
  fileSystem: File[];
  options: {
    files: {
      [source: string]: Target;
    };
  };
}

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

const testCases: TestCase[] = [
  {
    description: 'rename a file in-place',
    fileSystem: [
      {
        path: ['./src/rename-me.js', './src/renamed.js'],
        consumers: [['./src/consumer.js', './rename-me', './renamed']],
        imports: []
      }
    ],
    options: {
      files: {
        './src/rename-me.js': './renamed.js'
      }
    }
  },
  {
    description: 'move a file into a sibling of its current directory',
    fileSystem: [
      {
        path: ['./src/server.test.js', './test/server.js'],
        consumers: [],
        imports: []
      }
    ],
    options: {
      files: {
        './src/server.test.js': '../test/server.js'
      }
    }
  },
  {
    description: 'convert a flat directory of files into module folders',
    fileSystem: [
      {
        path: ['./src/services/a.js', './src/services/a/index.js'],
        consumers: [],
        imports: []
      },
      {
        path: ['./src/services/b.js', './src/services/b/index.js'],
        consumers: [],
        imports: []
      }
    ],
    options: {
      files: {
        './src/services/*.js': './{name}/index.js'
      }
    }
  },
  {
    description: 'use .jsx extension in all React components',
    fileSystem: [
      {
        path: ['./src/components/Button.js', './src/components/Button.jsx'],
        consumers: [],
        imports: []
      },
      {
        path: [
          './src/components/Panel/lib/Header.js',
          './src/components/Panel/lib/Header.jsx'
        ],
        consumers: [],
        imports: []
      }
    ],
    options: {
      files: {
        './src/components/**/*.js': './{name}.jsx'
      }
    }
  },
  {
    description: 'locate tests alongside source',
    fileSystem: [
      {
        path: ['./test/main.js', './src/main.spec.js'],
        consumers: [],
        imports: [['../src/main', './main']]
      },
      {
        path: ['./test/a/a.js', './src/a/a.spec.js'],
        consumers: [],
        imports: [['../../src/a/a', './a']]
      },
      {
        path: ['./test/a/b/b.js', './src/a/b/b.spec.js'],
        consumers: [],
        imports: [['../../../src/a/b/b', './b']]
      },
      {
        path: ['./test/a/b/c/c.js', './src/a/b/c/c.spec.js'],
        consumers: [],
        imports: [['../../../../src/a/b/c/c', './c']]
      }
    ],
    options: {
      files: {
        './test/*.js': '{rootDir}/src/{name}.spec.js',
        './test/*/*.js': '{rootDir}/src/{..}/{name}.spec.js',
        './test/*/*/*.js': '{rootDir}/src/{...}/{..}/{name}.spec.js',
        './test/*/*/*/*.js': '{rootDir}/src/{....}/{...}/{..}/{name}.spec.js'
      }
    }
  },
  {
    description: 'when target is a relative path to a directory',
    fileSystem: [
      {
        path: ['./src/a.js', './src/nested/a.js'],
        consumers: [],
        imports: []
      },
      {
        path: ['./src/b/b.js', './src/b/nested/b.js'],
        consumers: [],
        imports: []
      },
      {
        path: ['./src/b/c/c.js', './src/b/c/nested/c.js'],
        consumers: [],
        imports: []
      }
    ],
    options: {
      files: {
        './src/**/*.js': './nested'
      }
    }
  },
  {
    description: 'convert files with a specific name into module folders',
    fileSystem: [
      {
        path: ['./src/button/story.js', './src/button/story/index.js'],
        consumers: [],
        imports: []
      }
    ],
    options: {
      files: {
        './**/story.js': './story/index.js'
      }
    }
  },
  {
    description:
      'ignores glob targets because it is not clear what to do with them',
    fileSystem: [
      {
        path: ['./src/a.js'],
        consumers: [],
        imports: []
      }
    ],
    options: {
      files: {
        './src/a.js': './**/*.js'
      }
    }
  },
  {
    description: 'move multiple files into the same directory',
    fileSystem: [
      {
        path: ['./src/a.js', './dir/a.js'],
        consumers: [],
        imports: []
      }
    ],
    options: {
      files: {
        './src/*.js': '{rootDir}/dir',
        './src/a.js': '{rootDir}/dir/'
      }
    }
  },
  {
    description: 'move multiple interdependent files',
    fileSystem: [
      {
        path: ['./fake/dir/file-a.js', './fake/dir/nested/new-file.js'],
        consumers: [],
        imports: [
          ['./b/file-b', '../b/nested/new-file'],
          ['./b/c/file-c', '../b/c/nested/new-file']
        ]
      },
      {
        path: ['./fake/dir/b/file-b.js', './fake/dir/b/nested/new-file.js'],
        consumers: [],
        imports: [
          ['../file-a', '../../nested/new-file'],
          ['./c/file-c', '../c/nested/new-file']
        ]
      },
      {
        path: ['./fake/dir/b/c/file-c.js', './fake/dir/b/c/nested/new-file.js'],
        consumers: [],
        imports: [
          ['../../file-a', '../../../nested/new-file'],
          ['../file-b', '../../nested/new-file']
        ]
      }
    ],
    options: {
      files: {
        './fake/dir/**/*.js': './nested/new-file.js'
      }
    }
  }
];

[
  (moduleId: string) => `import '${moduleId}';`,
  (moduleId: string) => `require('${moduleId}');`
].forEach((getCode) => {
  describe(`when importing using ${getCode('ModuleID')}`, () => {
    testCases.forEach(({ description, fileSystem, options: { files } }) => {
      describe(description, () => {
        const OLD = 0;
        const NEW = 1;
        const valid: RuleTester.ValidTestCase[] = [];
        const invalid: RuleTester.InvalidTestCase[] = [];
        const mockFileSystem: mock.Config = {};
        const contentsChecks: Array<() => void> = [];

        fileSystem.forEach(({ consumers, imports, path }) => {
          const getPath = (i: number) => path[i];
          const getAbsolutePath = (i: number) => resolve(path[i] as string);

          const isFileMove = path.length === 2;
          const hasConsumers = consumers.length > 0;
          const oldPath = getPath(OLD);
          const oldAbsPath = getAbsolutePath(OLD);
          let code = [
            `/* ${oldPath} */`,
            getCode('pkg'),
            getCode('@scope/pkg')
          ].join('\n');
          let output = code;

          if (imports.length > 0) {
            imports.forEach(([oldModuleId, newModuleId]) => {
              code += getCode(oldModuleId);
              output += getCode(newModuleId);
            });
          }

          // should do nothing when file is not configured to move
          if (!isFileMove) {
            return valid.push({
              code,
              filename: oldAbsPath,
              options: [{ files }]
            });
          }

          const newPath = getPath(NEW);
          const newAbsPath = getAbsolutePath(NEW);

          // should update imports of files consuming moved file
          if (hasConsumers) {
            consumers.forEach(([consumerPath, oldId, newId]) => {
              invalid.push({
                code: getCode(oldId),
                errors: [{ message: `${oldPath} has moved to ${newPath}` }],
                filename: resolve(consumerPath),
                options: [{ files }],
                output: getCode(newId)
              });
            });
          }

          // should do nothing when file is already in new location
          valid.push({
            code: `/* ${newPath} */`,
            filename: newAbsPath,
            options: [{ files }]
          });

          // should move file and update imports when in old location
          invalid.push({
            code,
            errors: [{ message: `${oldPath} has moved to ${newPath}` }],
            filename: oldAbsPath,
            options: [{ files }],
            output
          });

          // ESLint's RuleTester does not write to Disk, but we can assert that:
          // 1. The File in its old location had its imports updated (via the
          //    `output` property above).
          // 2. A file was written in the new location containing the *old*
          //    contents, in reality this would be the new contents with the
          //    updated imports.
          mockFileSystem[oldPath as string] = code;
          contentsChecks.push(() => {
            expect(existsSync(oldAbsPath)).toEqual(false);
            expect(readTextFileSync(newAbsPath)).toEqual(code);
          });
        });

        beforeAll(() => {
          mock(mockFileSystem);
        });

        afterAll(() => {
          mock.restore();
        });

        it('moves files which should move', (done) => {
          ruleTester.run('move-files', rule, { valid, invalid });
          process.nextTick(() => {
            contentsChecks.forEach((contentsCheck) => contentsCheck());
            done();
          });
        });
      });
    });
  });
});
