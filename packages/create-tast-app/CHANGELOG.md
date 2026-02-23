# @nimoh-digital-solutions/create-tast-app

## 1.0.3

### Patch Changes

- 7bd16a6: fix(tast-ui): correct CSS export path to point at dist/index.css (actual Vite lib output)

  fix(create-tast-app): strip workspaces, changeset scripts, and monorepo-only devDeps from scaffolded app package.json to prevent Yarn from treating new projects as workspace roots

## 1.0.2

### Patch Changes

- 629a75c: feat: warn when CLI is run inside a Yarn workspace

  Detects if the current working directory is inside a Yarn workspace root
  (by traversing parent directories for a package.json with a workspaces field).
  If found, prints a clear warning that the new app should be created outside
  the monorepo or else Yarn will resolve scoped packages to workspace symlinks
  (which have no dist/) instead of the published registry packages.

## 1.0.1

### Patch Changes

- fc84d62: fix: add .npmignore to ensure dist/ is included in published packages

  Previously the root .gitignore excluded dist/ and with no package-level
  .npmignore, npm was falling back to .gitignore rules and omitting the built
  output from the tarball. Adding .npmignore to each publishable package causes
  npm to use it instead of .gitignore, so dist/ is correctly included.
