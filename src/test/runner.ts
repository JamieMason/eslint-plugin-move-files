import { CLIEngine, Linter } from 'eslint';
import { readFileSync } from 'fs';
import glob from 'glob';
import mock from 'mock-fs';
import { resolve } from 'path';

type OldPath = string;
type NewPath = string;
type UnfixedFile = [OldPath];
type FixedFile = [OldPath, NewPath];
type FilePathChanges = UnfixedFile | FixedFile;

type OldModuleId = string;
type NewModuleId = string;
type UnfixedImport = [OldModuleId];
type FixedImport = [OldModuleId, NewModuleId];
type ImportChanges = UnfixedImport | FixedImport;
type File = [FilePathChanges, ImportChanges[]];

type Target = string;

interface FilesOption {
  [source: string]: Target;
}

interface ContentsByPath {
  [source: string]: string;
}

interface MessagesByPath {
  [filePath: string]: Linter.LintMessage[];
}

interface Options {
  files: FilesOption;
}

export interface TestCase {
  files: File[];
  options: Options;
}

export interface TestReport {
  diskContents: {
    initial: ContentsByPath;
    expected: mock.Config;
    actual: ContentsByPath;
  };
  messages: MessagesByPath;
}

const BUILD_DIR_PATH = resolve(__dirname, '../../dist');
const CWD = '/fake/dir';

const getImportCode = (id: string) => `import '${id}';`;
const nextTick = () => new Promise((res) => process.nextTick(res));
const getImports = ([_, imports]: File): ImportChanges[] => imports;

const getInitialPath = ([[pathBefore]]: File): OldPath => pathBefore;

const getExpectedPath = ([[pathBefore, pathAfter]]: File): NewPath =>
  pathAfter ? pathAfter : pathBefore;

const getInitialFileNames = (files: File[]): OldPath[] =>
  files.map(getInitialPath);

const getExpectedFileNames = (files: File[]): string[] =>
  files.map(getExpectedPath);

const getInitialImports = (file: File): OldModuleId[] =>
  getImports(file).map(([idBefore]) => idBefore);

const getExpectedImports = (file: File): string[] =>
  getImports(file).map(([idBefore, idAfter]) => (idAfter ? idAfter : idBefore));

const getCommonCode = (file: File): string => {
  const marker = `/* ${getInitialPath(file)} */`;
  const pkg = getImportCode('pkg');
  const scopedPkg = getImportCode('@scope/pkg');
  return [marker, pkg, scopedPkg].join('\n');
};

const getInitialCode = (file: File): string => {
  return [getCommonCode(file)]
    .concat(getInitialImports(file).map(getImportCode))
    .join('\n');
};

const getExpectedCode = (file: File): string => {
  return [getCommonCode(file)]
    .concat(getExpectedImports(file).map(getImportCode))
    .join('\n');
};

const getDiskContentsBefore = (files: File[]) =>
  files.reduce<mock.Config>((config, file: File) => {
    const absolute = resolve(CWD, getInitialPath(file));
    config[absolute] = getInitialCode(file);
    return config;
  }, {});

const getExpectedDiskContents = (files: File[]) =>
  files.reduce<mock.Config>((config, file: File) => {
    const absolute = resolve(CWD, getExpectedPath(file));
    config[absolute] = getExpectedCode(file);
    return config;
  }, {});

const disk = {
  mock(files: File[]) {
    mock(getDiskContentsBefore(files));
  },
  read() {
    return glob
      .sync(`${CWD}/**`, { nodir: true })
      .map((path) => ({ path, contents: readFileSync(path, 'utf8') }))
      .reduce<ContentsByPath>((contentsByPath, { contents, path }) => {
        contentsByPath[path] = contents;
        return contentsByPath;
      }, {});
  },
  restore() {
    mock.restore();
  }
};

const getRunner = (options: Options, fix = false) =>
  new CLIEngine({
    cwd: CWD,
    fix,
    parserOptions: {
      ecmaVersion: 8,
      sourceType: 'module'
    },
    rulePaths: [BUILD_DIR_PATH],
    rules: {
      semi: 2,
      quotes: [2, 'single'],
      'move-files': [2, options]
    },
    useEslintrc: false
  });

const getMessagesByPath = (report: CLIEngine.LintReport) =>
  report.results.reduce<MessagesByPath>(
    (messagesByPath, { filePath, messages }) => {
      messagesByPath[filePath] = messages;
      return messagesByPath;
    },
    {}
  );

export const lintAndFix = async (testCase: TestCase) => {
  const expected = getExpectedDiskContents(testCase.files);
  const cwd = jest.spyOn(process, 'cwd');
  cwd.mockReturnValue(CWD);
  const eslint = getRunner(testCase.options, true);
  const filenames = getInitialFileNames(testCase.files);
  disk.mock(testCase.files);
  const initial = disk.read();
  const rawReport = eslint.executeOnFiles(filenames);
  const messages = getMessagesByPath(rawReport);
  CLIEngine.outputFixes(rawReport);
  await nextTick();
  const actual = disk.read();
  disk.restore();
  cwd.mockRestore();
  return JSON.parse(
    JSON.stringify({ diskContents: { initial, expected, actual }, messages })
      .split(CWD)
      .join('.')
  );
};

export const lintOnly = async (testCase: TestCase) => {
  const expected = getExpectedDiskContents(testCase.files);
  const cwd = jest.spyOn(process, 'cwd');
  cwd.mockReturnValue(CWD);
  const eslint = getRunner(testCase.options, false);
  const filenames = getInitialFileNames(testCase.files);
  disk.mock(testCase.files);
  const initial = disk.read();
  const rawReport = eslint.executeOnFiles(filenames);
  const messages = getMessagesByPath(rawReport);
  await nextTick();
  const actual = disk.read();
  disk.restore();
  cwd.mockRestore();
  return JSON.parse(
    JSON.stringify({ diskContents: { initial, expected, actual }, messages })
      .split(CWD)
      .join('.')
  );
};
