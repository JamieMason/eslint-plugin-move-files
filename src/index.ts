import { DEFAULT_OPTIONS } from './config';
import moveFiles from './move-files';

export = {
  rules: {
    'move-files': moveFiles
  },
  rulesConfig: {
    'move-files': [2, DEFAULT_OPTIONS]
  }
};
