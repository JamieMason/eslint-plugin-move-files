# eslint-plugin-move-files

> Move and rename files while keeping imports up to date

[![NPM version](http://img.shields.io/npm/v/eslint-plugin-move-files.svg?style=flat-square)](https://www.npmjs.com/package/eslint-plugin-move-files) [![NPM downloads](http://img.shields.io/npm/dm/eslint-plugin-move-files.svg?style=flat-square)](https://www.npmjs.com/package/eslint-plugin-move-files) [![Build Status](http://img.shields.io/travis/JamieMason/eslint-plugin-move-files/master.svg?style=flat-square)](https://travis-ci.org/JamieMason/eslint-plugin-move-files) [![Maintainability](https://api.codeclimate.com/v1/badges/170c5ae0fbf646e5678a/maintainability)](https://codeclimate.com/github/JamieMason/eslint-plugin-move-files/maintainability)

## Table of Contents

-   [🙋🏽 Status](#-status)
-   [📣 Summary](#-summary)
-   [🌩 Installation](#-installation)
-   [⚖️ Configuration](#️-configuration)
-   [🤔 Target Problem](#-target-problem)
-   [🙋🏽‍♀️ Getting Help](#♀️-getting-help)
-   [👀 Other Projects](#-other-projects)
-   [🤓 Author](#-author)

## 🙋🏽 Status

This plugin is in alpha status, there are some small issues to address and more testing is needed on real projects before it is considered ready.

## 📣 Summary

-   Move and rename files in bulk.
-   Update all [`import`][import] declarations and [`require`][require] statements in the codebase.
-   Standardise where certain files should be named and located.
-   Automatically move new files to the correct locations.

## 🌩 Installation

    npm install --save-dev eslint eslint-plugin-move-files

## ⚖️ Configuration

These changes relate to the `.eslintrc` file explained in [Configuring ESLint](https://eslint.org/docs/user-guide/configuring). You will need to ensure `'move-files'` is included in the `plugins` array and that a `'move-files/move-files'` property of the `rules` object is present and matches the structure described below.

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

### `files` option

`files` is an object whose keys define the **Sources** (which files should move) and whose values define the **Destinations** (where the files should move to).

-   Sources can match multiple files via the use of "[Globs][globs]".
-   Sources are resolved relative to the [`process.cwd()`][cwd] root directory of your project.
-   Destinations are resolved relative to each matched source file.
-   Destinations can optionally use [tokens](#String-Interpolation) such as `{name}` or `{ext}` to interpolate values parsed from the Source path.

### String Interpolation

Using `src/lib/module.spec.js` as an example, the following data would be available:

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

This dataset can be read using the following tokens. A destination of `'{rootDir}/test/{ancestors.0}/{name}.js'` for example would move this file to `/path/to/project/test/lib/module.js`.

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

Moving and renaming files in a large codebase can be time-consuming and error-prone due to:

-   The large number of files to search for and edit `import` declarations in.
-   The high probability of conflicts as you `git merge` from `master`.
-   The high probability of conflicts in other branches once yours is merged.

### Maintaining a standard file structure

Imagine that you want to migrate your codebase from being organised by role to be organised by feature. Once you've done the work of moving everything into the new structure, you want Contributors to follow the new approach rather than the old, and you want it to be easy to fix if they don't.

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

<!-- LINKS -->

[import]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import

[require]: https://nodejs.org/docs/latest-v10.x/api/modules.html#modules_require

[cwd]: https://nodejs.org/docs/latest-v10.x/api/process.html#process_process_cwd

[globs]: https://github.com/isaacs/node-glob#glob-primer

## 🙋🏽‍♀️ Getting Help

Get help with issues by creating a [Bug Report] or discuss ideas by opening a [Feature Request].

[bug report]: https://github.com/JamieMason/eslint-plugin-move-files/issues/new?template=bug_report.md

[feature request]: https://github.com/JamieMason/eslint-plugin-move-files/issues/new?template=feature_request.md

## 👀 Other Projects

If you find my Open Source projects useful, please share them ❤️

-   [**add-matchers**](https://github.com/JamieMason/add-matchers)<br>Write useful test matchers compatible with Jest and Jasmine.
-   [**eslint-formatter-git-log**](https://github.com/JamieMason/eslint-formatter-git-log)<br>ESLint Formatter featuring Git Author, Date, and Hash
-   [**eslint-plugin-prefer-arrow-functions**](https://github.com/JamieMason/eslint-plugin-prefer-arrow-functions)<br>Convert functions to arrow functions
-   [**get-time-between**](https://github.com/JamieMason/get-time-between#readme)<br>Measure the amount of time during work hours between two dates
-   [**image-optimisation-tools-comparison**](https://github.com/JamieMason/image-optimisation-tools-comparison)<br>A benchmarking suite for popular image optimisation tools.
-   [**ImageOptim-CLI**](https://github.com/JamieMason/ImageOptim-CLI)<br>Automates ImageOptim, ImageAlpha, and JPEGmini for Mac to make batch optimisation of images part of your automated build process.
-   [**is-office-hours**](https://github.com/JamieMason/is-office-hours#readme)<br>Determine whether a given date is within office hours
-   [**Jasmine-Matchers**](https://github.com/JamieMason/Jasmine-Matchers)<br>Write Beautiful Specs with Custom Matchers
-   [**jest-fail-on-console-reporter**](https://github.com/JamieMason/jest-fail-on-console-reporter#readme)<br>Disallow untested console output produced during tests
-   [**karma-benchmark**](https://github.com/JamieMason/karma-benchmark)<br>Run Benchmark.js over multiple Browsers, with CI compatible output
-   [**karma-jasmine-matchers**](https://github.com/JamieMason/karma-jasmine-matchers)<br>A Karma plugin - Additional matchers for the Jasmine BDD JavaScript testing library.
-   [**logservable**](https://github.com/JamieMason/logservable)<br>git log as an observable stream of JSON objects
-   [**self-help**](https://github.com/JamieMason/self-help#readme)<br>Interactive Q&A Guides for Web and the Command Line
-   [**syncpack**](https://github.com/JamieMason/syncpack#readme)<br>Manage multiple package.json files, such as in Lerna Monorepos and Yarn Workspaces

## 🤓 Author

<img src="https://www.gravatar.com/avatar/acdf106ce071806278438d8c354adec8?s=100" align="left">

I'm [Jamie Mason] from [Leeds] in England, I began Web Design and Development in 1999 and have been Contracting and offering Consultancy as Fold Left Ltd since 2012. Who I've worked with includes [Sky Sports], [Sky Bet], [Sky Poker], The [Premier League], [William Hill], [Shell], [Betfair], and Football Clubs including [Leeds United], [Spurs], [West Ham], [Arsenal], and more.

<div align="center">

[![Follow JamieMason on GitHub][github badge]][github]      [![Follow fold_left on Twitter][twitter badge]][twitter]

</div>

<!-- images -->

[github badge]: https://img.shields.io/github/followers/JamieMason.svg?style=social&label=Follow

[twitter badge]: https://img.shields.io/twitter/follow/fold_left.svg?style=social&label=Follow

<!-- links -->

[arsenal]: https://www.arsenal.com

[betfair]: https://www.betfair.com

[github]: https://github.com/JamieMason

[jamie mason]: https://www.linkedin.com/in/jamiemasonleeds

[leeds united]: https://www.leedsunited.com/

[leeds]: https://www.instagram.com/visitleeds

[premier league]: https://www.premierleague.com

[shell]: https://www.shell.com

[sky bet]: https://www.skybet.com

[sky poker]: https://www.skypoker.com

[sky sports]: https://www.skysports.com

[spurs]: https://www.tottenhamhotspur.com

[twitter]: https://twitter.com/fold_left

[west ham]: https://www.whufc.com

[william hill]: https://www.williamhill.com
