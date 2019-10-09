## 📣 Summary

- Move and rename files in bulk.
- Update all [`import`][import] declarations and [`require`][require] statements
  in the codebase.
- Standardise where certain files should be named and located.
- Automatically move new files to the correct locations.

## 🌩 Installation

```
npm install --save-dev eslint eslint-plugin-move-files
```

## 🤫 Caveats

- This plugin is in alpha, more testing is needed on real projects.
- It is best to run this rule on its own to avoid false-positives from plugins
  such as `eslint-plugin-imports` while files are being moved but files
  dependending on them have not yet been updated. This is necessary because the
  order which rules and files will run is not predictable or guaranteed.

## ⚖️ Configuration

## npm Scripts

It is recommended to run this plugin on its own, before running the other ESLint
Rules in your project. In this example you would run `npm run lint` to achieve
this:

```json
{
  "scripts": {
    "lint:fs": "eslint --fix --config .eslintrc-fs.js --no-inline-config 'src/**/*.js' 'test/**/*.js'",
    "lint:js": "eslint --fix --config .eslintrc.js 'src/**/*.js' 'test/**/*.js'",
    "lint": "npm run lint:fs && npm run lint:js"
  }
}
```

### ESLint

These changes relate to the `.eslintrc` file explained in
[Configuring ESLint](https://eslint.org/docs/user-guide/configuring). You will
need to ensure `'move-files'` is included in the `plugins` array and that a
`'move-files/move-files'` property of the `rules` object is present and matches
the structure described below.

```js
{
  "root": true,
  "parserOptions": {
    "ecmaVersion": 2019,
    "sourceType": "module"
  },
  "plugins": ["move-files"],
  "rules": {
    "move-files/move-files": [
      "error",
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
          "./test/*/*/*/*.js": "{rootDir}/src/{....}/{...}/{..}/{name}.spec.js",
          "./test/*/*/*/*/*.js": "{rootDir}/src/{.....}/{....}/{...}/{..}/{name}.spec.js",
          "./test/*/*/*/*/*/*.js": "{rootDir}/src/{......}/{.....}/{....}/{...}/{..}/{name}.spec.js",
          "./test/*/*/*/*/*/*/*.js": "{rootDir}/src/{.......}/{......}/{.....}/{....}/{...}/{..}/{name}.spec.js"
        }
      }
    ]
  }
}
```

### `files` option

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

<!-- LINKS -->

[import]:
  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import
[require]: https://nodejs.org/docs/latest-v10.x/api/modules.html#modules_require
[cwd]: https://nodejs.org/docs/latest-v10.x/api/process.html#process_process_cwd
[globs]: https://github.com/isaacs/node-glob#glob-primer
