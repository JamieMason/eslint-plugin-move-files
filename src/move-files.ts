import { Rule } from 'eslint';
import * as EsTree from 'estree';
import { outputFileSync, removeSync } from 'fs-extra';
import * as glob from 'glob';
import { basename, dirname, join, relative, resolve } from 'path';
import { ERROR_MOVED_FILE } from './config';
import { getIn } from './lib/get-in';
import { interpolate } from './lib/path-reader';

type FixList = Array<(fixer: Rule.RuleFixer) => Rule.Fix>;

interface FileIndex {
  [source: string]: string;
}

interface ModuleStrategy {
  getModuleId: (node: any) => string;
  getQuotes: (node: any) => string;
  getSource: (node: any) => EsTree.Identifier;
}

const isDir = (path: string) => !basename(path).includes('.');

const withLeadingDot = (moduleId: string) =>
  moduleId.startsWith('.') || moduleId.startsWith('/')
    ? moduleId
    : `./${moduleId}`;

const withoutFileExtension = (filePath: string) =>
  filePath.replace(/\.[^.]+$/, '');

const getNewModuleId = (filePath: string) =>
  withLeadingDot(withoutFileExtension(filePath));

const withFileExtension = (filePath: string) => {
  try {
    return require.resolve(filePath);
  } catch (e) {
    return `${filePath}.js`;
  }
};

const updateMovedFile = (
  files: FileIndex,
  dirPath: string,
  newFilePath: string,
  n: EsTree.Node,
  fixes: FixList,
  { getModuleId, getQuotes, getSource }: ModuleStrategy
) => {
  const node = n as any;
  const moduleId = getModuleId(node);
  if (!moduleId.startsWith('.')) {
    return;
  }
  const newDirPath = dirname(newFilePath);
  if (newDirPath !== dirPath) {
    const quotes = getQuotes(node);
    const rawModulePath = withFileExtension(resolve(dirPath, moduleId));
    const modulePath = files[rawModulePath] || rawModulePath;
    const newPathToModule = relative(newDirPath, modulePath);
    const newModuleId = getNewModuleId(newPathToModule);
    const withQuotes = `${quotes}${newModuleId}${quotes}`;
    fixes.push((fixer) => fixer.replaceText(getSource(node), withQuotes));
  }
};

const updateConsumer = (
  context: Rule.RuleContext,
  files: FileIndex,
  dirPath: string,
  n: EsTree.Node,
  { getModuleId, getQuotes, getSource }: ModuleStrategy
) => {
  const node = n as any;
  const moduleId = getModuleId(node);
  if (!moduleId.startsWith('.')) {
    return;
  }
  const quotes = getQuotes(node);
  const modulePath = withFileExtension(resolve(dirPath, moduleId));
  const newModulePath = files[modulePath];
  if (newModulePath) {
    const newModuleId = getNewModuleId(relative(dirPath, newModulePath));
    const withQuotes = `${quotes}${newModuleId}${quotes}`;
    return context.report({
      fix: (fixer) => fixer.replaceText(getSource(node), withQuotes),
      message: ERROR_MOVED_FILE(
        withLeadingDot(relative(process.cwd(), modulePath)),
        withLeadingDot(relative(process.cwd(), newModulePath))
      ),
      node: getSource(node)
    });
  }
};

const requireStrategy: ModuleStrategy = {
  getModuleId: (node: any) => getIn('arguments.0.value', node, ''),
  getQuotes: (node: any) => node.arguments[0].raw.charAt(0),
  getSource: (node: any) => node.arguments[0]
};

const importStrategy: ModuleStrategy = {
  getModuleId: (node: any) => node.source.value,
  getQuotes: (node: any) => node.source.raw.charAt(0),
  getSource: (node: any) => node.source
};

const rule: (context: Rule.RuleContext) => Rule.RuleListener = (context) => {
  const CWD = process.cwd();
  const sourceCode = context.getSourceCode();
  const patterns: FileIndex = getIn('options.0.files', context, {});
  const files: FileIndex = {};

  Object.entries(patterns)
    .filter(([_, targetPattern]) => targetPattern.search(/[*+?!|@]/) === -1)
    .forEach(([sourcePattern, targetPattern]) => {
      glob
        .sync(resolve(CWD, sourcePattern), { absolute: true, nodir: true })
        .forEach((source) => {
          const target = interpolate(targetPattern, source);
          files[source] = isDir(target)
            ? join(resolve(dirname(source), target), basename(source))
            : resolve(dirname(source), target);
        });
    });

  const currentFilePath = context.getFilename();
  const dirPath = dirname(currentFilePath);
  const newFilePath = files[currentFilePath];
  const isFileBeingMoved = Boolean(newFilePath);

  if (isFileBeingMoved) {
    const fixes: FixList = [];
    return {
      'CallExpression[callee.name="require"]'(n: EsTree.Node) {
        return updateMovedFile(
          files,
          dirPath,
          newFilePath,
          n,
          fixes,
          requireStrategy
        );
      },
      ImportDeclaration(n: EsTree.Node) {
        return updateMovedFile(
          files,
          dirPath,
          newFilePath,
          n,
          fixes,
          importStrategy
        );
      },
      'Program:exit'(n: EsTree.Node) {
        const node = n as EsTree.Program;
        return context.report({
          fix(fixer) {
            const contents = sourceCode.getText();
            process.nextTick(() => removeSync(currentFilePath));
            outputFileSync(newFilePath, contents);
            // ESLint's types don't reflect that an array of fixes can be returned
            return (fixes.map((fn) => fn(fixer)) as unknown) as Rule.Fix;
          },
          message: ERROR_MOVED_FILE(
            withLeadingDot(relative(process.cwd(), currentFilePath)),
            withLeadingDot(relative(process.cwd(), newFilePath))
          ),
          node
        });
      }
    };
  }

  return {
    'CallExpression[callee.name="require"]'(n: EsTree.Node) {
      return updateConsumer(context, files, dirPath, n, requireStrategy);
    },
    ImportDeclaration(n: EsTree.Node) {
      return updateConsumer(context, files, dirPath, n, importStrategy);
    }
  };
};

export = rule;
