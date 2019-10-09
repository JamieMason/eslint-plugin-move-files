import { Rule } from 'eslint';
import * as EsTree from 'estree';
import { copyFileSync, ensureFileSync, removeSync } from 'fs-extra';
import * as glob from 'glob';
import { basename, dirname, join, relative, resolve } from 'path';
import { ERROR_MOVED_FILE } from './config';
import { getIn } from './lib/get-in';
import { interpolate } from './lib/path-reader';

interface FileIndex {
  [source: string]: string;
}

interface VisitedFiles {
  [source: string]: boolean;
}

let files: FileIndex;

const visitedFiles: VisitedFiles = {};

const isDir = (path: string) => !basename(path).includes('.');

const withLeadingDot = (moduleId: string) =>
  moduleId.startsWith('.') || moduleId.startsWith('/')
    ? moduleId
    : `./${moduleId}`;

const withoutFileExtension = (filePath: string) =>
  filePath.replace(/\.[^.]+$/, '');

const getNewDepId = (filePath: string) =>
  withLeadingDot(withoutFileExtension(filePath));

const withFileExtension = (filePath: string) => {
  try {
    return require.resolve(filePath);
  } catch (e) {
    return `${filePath}.js`;
  }
};

const updateMovedFile = (
  context: Rule.RuleContext,
  fileIndex: FileIndex,
  fileDirPath: string,
  newFilePath: string,
  n: EsTree.Node,
  getDepId: (node: any) => string
) => {
  const node = n as any;
  const depId = getDepId(node);
  if (!depId.startsWith('.')) {
    return;
  }
  const newFileDirPath = dirname(newFilePath);
  if (newFileDirPath !== fileDirPath) {
    const depPath = withFileExtension(resolve(fileDirPath, depId));
    const newDepPath = fileIndex[depPath] || depPath;
    const newPathToDep = relative(newFileDirPath, newDepPath);
    const newDepId = getNewDepId(newPathToDep);
    return context.report({
      fix: (fixer) =>
        fixer.replaceText(
          node,
          context
            .getSourceCode()
            .getText(node)
            .replace(depId, newDepId)
        ),
      message: ERROR_MOVED_FILE(
        withLeadingDot(relative(process.cwd(), depPath)),
        withLeadingDot(relative(process.cwd(), newDepPath))
      ),
      node
    });
  }
};

const updateConsumer = (
  context: Rule.RuleContext,
  fileIndex: FileIndex,
  dirPath: string,
  n: EsTree.Node,
  getDepId: (node: any) => string
) => {
  const node = n as any;
  const moduleId = getDepId(node);
  if (!moduleId.startsWith('.')) {
    return;
  }
  const modulePath = withFileExtension(resolve(dirPath, moduleId));
  const newModulePath = fileIndex[modulePath];
  if (newModulePath) {
    const newModuleId = getNewDepId(relative(dirPath, newModulePath));
    return context.report({
      fix: (fixer) =>
        fixer.replaceText(
          node,
          context
            .getSourceCode()
            .getText(node)
            .replace(moduleId, newModuleId)
        ),
      message: ERROR_MOVED_FILE(
        withLeadingDot(relative(process.cwd(), modulePath)),
        withLeadingDot(relative(process.cwd(), newModulePath))
      ),
      node
    });
  }
};

const getRequireDepId = (node: any) => getIn('arguments.0.value', node, '');
const getImportDepId = (node: any) => node.source.value;

const rule: Rule.RuleModule = {
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
  create: (context) => {
    const currentFilePath = context.getFilename();
    const dirPath = dirname(currentFilePath);

    if (visitedFiles[currentFilePath]) {
      return {};
    }

    visitedFiles[currentFilePath] = true;

    if (!files) {
      const patterns: FileIndex = getIn('options.0.files', context, {});
      files = {};
      Object.entries(patterns)
        .filter(([_, targetPattern]) => targetPattern.search(/[*+?!|@]/) === -1)
        .forEach(([sourcePattern, targetPattern]) => {
          glob
            .sync(sourcePattern, { absolute: true, nodir: true })
            .forEach((source) => {
              const target = interpolate(targetPattern, source);
              files[source] = isDir(target)
                ? join(resolve(dirname(source), target), basename(source))
                : resolve(dirname(source), target);
            });
        });
    }

    const newFilePath = files[currentFilePath];
    const isFileBeingMoved = Boolean(newFilePath);

    if (isFileBeingMoved) {
      return {
        'CallExpression[callee.name="require"]'(n: EsTree.Node) {
          return updateMovedFile(
            context,
            files,
            dirPath,
            newFilePath,
            n,
            getRequireDepId
          );
        },
        ImportDeclaration(n: EsTree.Node) {
          return updateMovedFile(
            context,
            files,
            dirPath,
            newFilePath,
            n,
            getImportDepId
          );
        },
        onCodePathEnd(codePath: Rule.CodePath, n: EsTree.Node) {
          if (n.type === 'Program') {
            process.nextTick(() => {
              ensureFileSync(newFilePath);
              copyFileSync(currentFilePath, newFilePath);
              removeSync(currentFilePath);
            });
          }
        }
      };
    }

    return {
      'CallExpression[callee.name="require"]'(n: EsTree.Node) {
        return updateConsumer(context, files, dirPath, n, getRequireDepId);
      },
      ImportDeclaration(n: EsTree.Node) {
        return updateConsumer(context, files, dirPath, n, getImportDepId);
      }
    };
  }
};

export default rule;
