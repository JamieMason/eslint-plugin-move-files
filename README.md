# eslint-plugin-move-files

> Move and rename files while keeping imports up to date.

[![NPM version](http://img.shields.io/npm/v/eslint-plugin-move-files.svg?style=flat-square)](https://www.npmjs.com/package/eslint-plugin-move-files)
[![NPM downloads](http://img.shields.io/npm/dm/eslint-plugin-move-files.svg?style=flat-square)](https://www.npmjs.com/package/eslint-plugin-move-files)
[![Build Status](http://img.shields.io/travis/JamieMason/eslint-plugin-move-files/master.svg?style=flat-square)](https://travis-ci.org/JamieMason/eslint-plugin-move-files)
[![Maintainability](https://api.codeclimate.com/v1/badges/170c5ae0fbf646e5678a/maintainability)](https://codeclimate.com/github/JamieMason/eslint-plugin-move-files/maintainability)
[![Gitter Chat](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/JamieMason/eslint-plugin-move-files)
[![Donate via PayPal](https://img.shields.io/badge/donate-paypal-blue.svg)](https://www.paypal.me/foldleft)
[![Backers](https://opencollective.com/fold_left/backers/badge.svg)](https://opencollective.com/fold_left#backer)
[![Sponsors](https://opencollective.com/fold_left/sponsors/badge.svg)](https://opencollective.com/fold_left#sponsors)
[![Analytics](https://ga-beacon.appspot.com/UA-45466560-5/eslint-plugin-move-files?flat&useReferer)](https://github.com/igrigorik/ga-beacon)
[![Follow JamieMason on GitHub](https://img.shields.io/github/followers/JamieMason.svg?style=social&label=Follow)](https://github.com/JamieMason)
[![Follow fold_left on Twitter](https://img.shields.io/twitter/follow/fold_left.svg?style=social&label=Follow)](https://twitter.com/fold_left)

## ⚠️ Project Status

This plugin is in alpha status, there are some small issues to address and more
testing is needed on real projects before it is considered ready.

## 📣 Summary

- Move and rename files in bulk.
- Update all [`import`][import] declarations and [`require`][require] statements
  in the codebase.
- Standardise where certain files should be named and located.
- Automatically move new files to the correct locations.

## ☁️ Installation

```
npm install --save-dev eslint eslint-plugin-move-files
```

## ⚖️ Configuration

These changes relate to the `.eslintrc` file explained in
[Configuring ESLint](https://eslint.org/docs/user-guide/configuring). You will
need to ensure `'move-files'` is included in the `plugins` array and that a
`'move-files/move-files'` property of the `rules` object is present and matches
the structure described below.

```js
{
  "plugins": ["move-files"],
  "rules": {
    "move-files/move-files": [
      "warn",
      {
        "files": {
          // rename a file in-place
          "./src/rename-me.js": "./renamed.js",
          // move a file into a sibling of its current directory
          "./src/server.test.js": "../test/server.js",
          // convert a flat directory of files into module folders
          "./src/services/*.js": "./{name}/index.js",
          // use .jsx extension in all React components
          "./src/components/**/*.js": "./{name}.jsx",
          // locate tests alongside source
          "./test/*.js": "{rootDir}/src/{name}.spec.js",
          "./test/*/*.js": "{rootDir}/src/{..}/{name}.spec.js",
          "./test/*/*/*.js": "{rootDir}/src/{...}/{..}/{name}.spec.js",
          "./test/*/*/*/*.js": "{rootDir}/src/{....}/{...}/{..}/{name}.spec.js"
        }
      }
    ]
  }
}
```

## `files` option

`files` is an object whose keys define the **Sources** (which files should move)
and whose values define the **Destinations** (where the files should move to).

- Sources can match multiple files via the use of "[Globs][globs]".
- Sources are resolved relative to the [`process.cwd()`][cwd] root directory of
  your project.
- Destinations are resolved relative to each matched source file.
- Destinations can optionally use [tokens](#String-Interpolation) such as
  `{name}` or `{ext}` to interpolate values parsed from the Source path.

### String Interpolation

Using `src/lib/module.spec.js` as an example, the following data would be
available:

```json
{
  "rootDir": "/path/to/project",
  "dir": "src/lib",
  "base": "module.spec.js",
  "name": "module",
  "ext": "spec.js",
  "dirs": ["src", "lib"],
  "exts": ["spec", "js"],
  "ancestors": ["lib", "src"]
}
```

This dataset can be read using the following tokens. A destination of
`'{rootDir}/test/{ancestors.0}/{name}.js'` for example would move this file to
`/path/to/project/test/lib/module.js`.

| Token                      | Value              |
| -------------------------- | ------------------ |
| `{rootDir}`                | `/path/to/project` |
| `{dir}`                    | `src/lib`          |
| `{base}` or `{.}`          | `module.spec.js`   |
| `{name}`                   | `module`           |
| `{ext}`                    | `spec.js`          |
| `{dirs.0}`                 | `src`              |
| `{dirs.1}`                 | `lib`              |
| `{exts.0}`                 | `spec`             |
| `{exts.1}`                 | `js`               |
| `{ancestors.0}` or `{..}`  | `lib`              |
| `{ancestors.1}` or `{...}` | `src`              |

## 🤔 Target Problem

### Moving files with increased confidence

Moving and renaming files in a large codebase can be time-consuming and
error-prone due to:

- The large number of files to search for and edit `import` declarations in.
- The high probability of conflicts as you `git merge` from `master`.
- The high probability of conflicts in other branches once yours is merged.

### Maintaining a standard file structure

Imagine that you want to migrate your codebase from being organised by role to
be organised by feature. Once you've done the work of moving everything into the
new structure, you want Contributors to follow the new approach rather than the
old, and you want it to be easy to fix if they don't.

```
Organised by Role

├── fixtures
│   └── billing.js
├── resolvers
│   └── billing.js
└── schema
    └── billing.js

Organised by Feature

└── billing
    ├── fixtures.js
    ├── resolvers.js
    └── schema.js
```

## ❓ Getting Help

- Get help with issues by creating a
  [Bug Report](https://github.com/JamieMason/eslint-plugin-move-files/issues/new?template=bug_report.md).
- Discuss ideas by opening a
  [Feature Request](https://github.com/JamieMason/eslint-plugin-move-files/issues/new?template=feature_request.md).

<!-- LINKS -->

[import]:
  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import
[require]: https://nodejs.org/docs/latest-v10.x/api/modules.html#modules_require
[cwd]: https://nodejs.org/docs/latest-v10.x/api/process.html#process_process_cwd
[globs]: https://github.com/isaacs/node-glob#glob-primer
