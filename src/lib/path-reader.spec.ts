import { resolve } from 'path';
import { getValue, interpolate } from './path-reader';

const PWD = process.cwd();

describe('getValue', () => {
  type Query = string;
  type ExpectedResult = string;
  type Assertion = [Query, ExpectedResult];
  type AbsolutePath = string;
  type Test = [AbsolutePath, Assertion[]];
  const tests: Test[] = [
    [
      resolve(PWD, './src/lib/module.js'),
      [
        ['...', 'src'],
        ['..', 'lib'],
        ['.', 'module.js'],
        ['ancestors.0', 'lib'],
        ['ancestors.1', 'src'],
        ['dirs.0', 'src'],
        ['dirs.1', 'lib'],
        ['exts.0', 'js'],
        ['exts.1', ''],
        ['base', 'module.js'],
        ['dir', 'src/lib'],
        ['ext', 'js'],
        ['name', 'module'],
        ['rootDir', PWD],
        ['invalid', ''],
        ['unrecognised', '']
      ]
    ],
    [
      resolve(PWD, './src/lib/module.spec.js'),
      [
        ['...', 'src'],
        ['..', 'lib'],
        ['.', 'module.spec.js'],
        ['ancestors.0', 'lib'],
        ['ancestors.1', 'src'],
        ['dirs.0', 'src'],
        ['dirs.1', 'lib'],
        ['exts.0', 'spec'],
        ['exts.1', 'js'],
        ['base', 'module.spec.js'],
        ['dir', 'src/lib'],
        ['ext', 'spec.js'],
        ['name', 'module'],
        ['rootDir', PWD],
        ['invalid', ''],
        ['unrecognised', '']
      ]
    ],
    [
      resolve(PWD, './.babelrc'),
      [
        ['...', ''],
        ['..', ''],
        ['.', '.babelrc'],
        ['ancestors.0', ''],
        ['ancestors.1', ''],
        ['dirs.0', ''],
        ['dirs.1', ''],
        ['exts.0', 'babelrc'],
        ['exts.1', ''],
        ['base', '.babelrc'],
        ['dir', ''],
        ['ext', 'babelrc'],
        ['name', ''],
        ['rootDir', PWD],
        ['invalid', ''],
        ['unrecognised', '']
      ]
    ],
    [
      resolve(PWD, './.eslintrc.js'),
      [
        ['...', ''],
        ['..', ''],
        ['.', '.eslintrc.js'],
        ['ancestors.0', ''],
        ['ancestors.1', ''],
        ['dirs.0', ''],
        ['dirs.1', ''],
        ['exts.0', 'eslintrc'],
        ['exts.1', 'js'],
        ['base', '.eslintrc.js'],
        ['dir', ''],
        ['ext', 'eslintrc.js'],
        ['name', ''],
        ['rootDir', PWD],
        ['invalid', ''],
        ['unrecognised', '']
      ]
    ]
  ];

  tests.forEach(([absolutePath, assertions]) => {
    describe(`when path is '${absolutePath}'`, () => {
      assertions.forEach(([query, expected]) => {
        describe(`when query is '${query}'`, () => {
          it(`returns '${expected}'`, () => {
            expect(getValue(query, absolutePath)).toEqual(expected);
          });
        });
      });
    });
  });
});

describe('interpolate', () => {
  type Template = string;
  type ExpectedResult = string;
  type Assertion = [Template, ExpectedResult];
  type AbsolutePath = string;
  type Test = [AbsolutePath, Assertion[]];
  const tests: Test[] = [
    [
      resolve(PWD, './src/lib/module.spec.js'),
      [
        [
          '{rootDir}/test/{ancestors.0}/{name}.js',
          resolve(PWD, './test/lib/module.js')
        ],
        ['{rootDir}/test/{..}/{name}.js', resolve(PWD, './test/lib/module.js')]
      ]
    ]
  ];

  tests.forEach(([absolutePath, assertions]) => {
    describe(`when path is '${absolutePath}'`, () => {
      assertions.forEach(([template, expected]) => {
        describe(`when template is '${template}'`, () => {
          it(`returns '${expected}'`, () => {
            expect(interpolate(template, absolutePath)).toEqual(expected);
          });
        });
      });
    });
  });
});
