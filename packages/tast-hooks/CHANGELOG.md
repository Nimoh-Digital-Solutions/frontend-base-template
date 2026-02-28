# @nimoh-digital-solutions/tast-hooks

## 1.2.3

### Patch Changes

- d7e3f4d: docs: add comprehensive README documentation for all packages
- Updated dependencies [d7e3f4d]
  - @nimoh-digital-solutions/tast-utils@1.1.2

## 1.2.2

### Patch Changes

- 27506fa: feat(tast-hooks): add useNetworkStatus hook

  New `useNetworkStatus` hook that wraps the Navigator online/offline API and
  provides reactive `isOnline` state. Includes accompanying unit tests.

- Updated dependencies [27506fa]
  - @nimoh-digital-solutions/tast-utils@1.1.1

## 1.2.1

### Patch Changes

- 0d42f0f: fix: resolve workspace: protocol in published dependencies
  - tast-ui: change `@nimoh-digital-solutions/tast-utils` from `workspace:^` to `^1.1.0` in runtime `dependencies` — fixes `YN0001: workspace:^` error for any project installing tast-ui
  - tast-hooks: same fix for `@nimoh-digital-solutions/tast-utils`
  - create-tast-app: banner now shows the actual published version instead of hardcoded v1.0.0
  - All packages: add `"tag": "latest"` to publishConfig so the `@latest` dist-tag is always updated on publish

## 1.2.0

### Minor Changes

- da7509e: feat: add useToast hook for managing transient notifications

## 1.1.0

### Minor Changes

- c73a57c: feat: add 6 common hooks — useDebounce, useMediaQuery, useClickOutside, useWindowSize, usePrevious, useToggle

## 1.0.1

### Patch Changes

- fc84d62: fix: add .npmignore to ensure dist/ is included in published packages

  Previously the root .gitignore excluded dist/ and with no package-level
  .npmignore, npm was falling back to .gitignore rules and omitting the built
  output from the tarball. Adding .npmignore to each publishable package causes
  npm to use it instead of .gitignore, so dist/ is correctly included.

- Updated dependencies [fc84d62]
  - @nimoh-digital-solutions/tast-utils@1.0.1
