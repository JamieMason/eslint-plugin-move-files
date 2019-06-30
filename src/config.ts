export const DEFAULT_OPTIONS = {
  files: {},
  rulesDir: process.cwd()
};

export const ERROR_FLAT_DIRECTORY = (source: string, target: string) =>
  `Moving multiple files "${source}" to a flat directory at "${target}" is not currently supported`;

export const ERROR_MOVED_FILE = (oldPath: string, newPath: string) =>
  `${oldPath} has moved to ${newPath}`;

export const ERROR_MULTIPLE_TARGETS = (source: string, target: string) =>
  `Unclear where to move "${source}" when target is "${target}"`;
