# @nimoh-digital-solutions/tast-ui

## 1.1.0

### Minor Changes

- 44e6d12: feat: add 'dim' theme to Theme type and 3-way toggle cycle
  - tast-utils: Theme type extended to 'light' | 'dark' | 'dim'
  - tast-ui: ThemeContext toggleTheme cycles light → dim → dark → light
    instead of the previous binary light ↔ dark toggle

### Patch Changes

- Updated dependencies [44e6d12]
  - @nimoh-digital-solutions/tast-utils@1.1.0

## 1.0.3

### Patch Changes

- a5a45fa: feat(create-tast-app): brand colour prompts during scaffolding

  During `npx create-tast-app`, three optional hex colour prompts are now
  shown (primary, secondary, tertiary). Providing a hex value generates a
  `src/styles/themes/_brand.scss` file with auto-derived light/dark
  variants that override the default blue/gray/teal palette for both light
  and dark themes. Leaving a prompt blank keeps the template defaults.

  fix(tast-ui): postcss-jit-props strips unused Open Props from dist CSS

  `postcss-jit-props` is now wired into the tast-ui Vite build config.
  Only the Open Props vars actually used by components are emitted
  (--ease-3, --size-7, --size-8) — down from ~150 vars to 3.
  - Button --sm and --lg min-height migrated to var(--size-7) / var(--size-8)

## 1.0.2

### Patch Changes

- 7bd16a6: fix(tast-ui): correct CSS export path to point at dist/index.css (actual Vite lib output)

  fix(create-tast-app): strip workspaces, changeset scripts, and monorepo-only devDeps from scaffolded app package.json to prevent Yarn from treating new projects as workspace roots

## 1.0.1

### Patch Changes

- fc84d62: fix: add .npmignore to ensure dist/ is included in published packages

  Previously the root .gitignore excluded dist/ and with no package-level
  .npmignore, npm was falling back to .gitignore rules and omitting the built
  output from the tarball. Adding .npmignore to each publishable package causes
  npm to use it instead of .gitignore, so dist/ is correctly included.

- Updated dependencies [fc84d62]
  - @nimoh-digital-solutions/tast-utils@1.0.1
