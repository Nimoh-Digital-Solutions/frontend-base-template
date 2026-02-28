# @nimoh-digital-solutions/tast-utils

## 1.1.4

### Patch Changes

- 0f46762: Republish packages with MIT LICENSE files included

## 1.1.3

### Patch Changes

- 39fa9d2: Add MIT LICENSE files and license field to all packages

## 1.1.2

### Patch Changes

- d7e3f4d: docs: add comprehensive README documentation for all packages

## 1.1.1

### Patch Changes

- 27506fa: fix(tast-utils): update HTTP utility types and exports
  - Updated HTTP utility types for generic auth token handling
  - Adjusted exports for consistency with app-level service layer

## 1.1.0

### Minor Changes

- 44e6d12: feat: add 'dim' theme to Theme type and 3-way toggle cycle
  - tast-utils: Theme type extended to 'light' | 'dark' | 'dim'
  - tast-ui: ThemeContext toggleTheme cycles light → dim → dark → light
    instead of the previous binary light ↔ dark toggle

## 1.0.1

### Patch Changes

- fc84d62: fix: add .npmignore to ensure dist/ is included in published packages

  Previously the root .gitignore excluded dist/ and with no package-level
  .npmignore, npm was falling back to .gitignore rules and omitting the built
  output from the tarball. Adding .npmignore to each publishable package causes
  npm to use it instead of .gitignore, so dist/ is correctly included.
