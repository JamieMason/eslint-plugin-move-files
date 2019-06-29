export const DEFAULT_OPTIONS = {
  files: {},
  rulesDir: process.cwd()
};

export const ERROR_MOVED_FILE = (oldPath: string, newPath: string) =>
  `${oldPath} has moved to ${newPath}`;
