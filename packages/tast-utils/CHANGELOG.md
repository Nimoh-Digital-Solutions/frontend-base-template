# @nimoh-digital-solutions/tast-utils

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
