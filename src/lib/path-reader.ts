import { basename, dirname, relative, sep } from 'path';
import { getIn } from './get-in';

const getAncestors = (absPath: string) =>
  getDir(absPath)
    .split(sep)
    .reverse();
const getAncestorsIndex = (query: string) => query.replace('ancestors.', '');
const getBase = (absPath: string) => basename(absPath);
const getDir = (absPath: string) => relative(process.cwd(), dirname(absPath));
const getDirs = (absPath: string) => getDir(absPath).split(sep);
const getDirsIndex = (query: string) => query.replace('dirs.', '');
const getExt = (absPath: string) =>
  basename(absPath).slice(basename(absPath).indexOf('.') + 1);
const getExts = (absPath: string) =>
  getExt(absPath)
    .split('.')
    .filter(Boolean);
const getExtsIndex = (query: string) => query.replace('exts.', '');
const getName = (absPath: string) =>
  basename(absPath).slice(0, basename(absPath).indexOf('.'));
const getRootDir = () => process.cwd();

export const getValue = (query: string, absPath: string) => {
  if (query === 'rootDir') {
    return getRootDir();
  }
  if (query === 'dir') {
    return getDir(absPath);
  }
  if (query === 'base' || query === '.') {
    return getBase(absPath);
  }
  if (query === 'name') {
    return getName(absPath);
  }
  if (query === 'ext') {
    return getExt(absPath);
  }
  if (query.startsWith('dirs.')) {
    return getIn(getDirsIndex(query), getDirs(absPath), '');
  }
  if (query.startsWith('exts.')) {
    return getIn(getExtsIndex(query), getExts(absPath), '');
  }
  if (query.startsWith('ancestors.')) {
    return getIn(getAncestorsIndex(query), getAncestors(absPath), '');
  }
  if (query.search(/^\.+$/) !== -1) {
    return getIn(query.length - 2, getAncestors(absPath), '');
  }
  return '';
};

export const interpolate = (template: string, absPath: string) =>
  template.replace(/{([^,}]+)}/g, (_, query) => getValue(query, absPath));
