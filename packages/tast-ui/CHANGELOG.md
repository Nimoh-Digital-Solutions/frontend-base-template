# @nimoh-digital-solutions/tast-ui

## 1.5.0

### Minor Changes

- 8ba3649: Add animated split-panel auth flow and branded PageLoader component.

  All three auth views (login, register, forgot-password) now share a single `AuthPage` with directional slide transitions driven by `motion/react`. The branding panel swaps content per view (LogIn, UserPlus, LockKeyhole icons), the forgot-password route is nested under `AuthPage` rather than being a standalone page, and the "Forgot password?" link in `LoginForm` triggers an in-place view change instead of a hard navigation.

  A new `PageLoader` component replaces the bare "Loading…" text shown during auth bootstrap and lazy-route code-splitting. It renders a full-viewport centred screen matching the auth visual language — warm off-white background, brand logo mark, and an animated spinner in brand purple.

  React Router v7 leaf-route warning silenced — auth child routes now carry `element: null` and all `Suspense` fallbacks use `<PageLoader />` (orphaned `pageFallback.module.scss` removed).

  Auth bootstrap fix: `useInitAuth` no longer calls `POST /auth/token/refresh/` unconditionally on every page load. A non-sensitive `tast:sessionActive` flag is written to `localStorage` on login (`setAuth`) and cleared on logout (`clearAuth`). The bootstrap hook skips the refresh call entirely when the flag is absent, eliminating the spurious 500 error on the login page for unauthenticated users.

## 1.4.0

### Minor Changes

- 1542f80: Add animated split-panel auth flow for login, register, and forgot-password pages.

  All three auth views now share a single `AuthPage` with directional slide transitions driven by `motion/react`. The branding panel swaps content per view (LogIn, UserPlus, LockKeyhole icons), the forgot-password route is nested under `AuthPage` rather than being a standalone page, and the "Forgot password?" link in `LoginForm` triggers an in-place view change instead of a hard navigation.

## 1.3.4

### Patch Changes

- 66f32de: CI: auto-update lockfile after changesets version bump
- Updated dependencies [66f32de]
  - @nimoh-digital-solutions/tast-utils@1.1.5

## 1.3.3

### Patch Changes

- 0f46762: Republish packages with MIT LICENSE files included
- Updated dependencies [0f46762]
  - @nimoh-digital-solutions/tast-utils@1.1.4

## 1.3.2

### Patch Changes

- 39fa9d2: Add MIT LICENSE files and license field to all packages
- Updated dependencies [39fa9d2]
  - @nimoh-digital-solutions/tast-utils@1.1.3

## 1.3.1

### Patch Changes

- d7e3f4d: docs: add comprehensive README documentation for all packages
- Updated dependencies [d7e3f4d]
  - @nimoh-digital-solutions/tast-utils@1.1.2

## 1.3.0

### Minor Changes

- 27506fa: feat(tast-ui): add EmptyState, Pagination, Skeleton components; fix ErrorBoundary
  - New `EmptyState` component with illustration, title, description, and action slots
  - New `Pagination` component with page navigation, page-size selector, and a11y support
  - New `Skeleton` component with variant shapes (text, circular, rectangular, rounded)
  - `ErrorBoundary` updated to use `EmptyState` for fallback rendering
  - All components include SCSS Modules, TypeScript interfaces, and barrel exports

### Patch Changes

- Updated dependencies [27506fa]
  - @nimoh-digital-solutions/tast-utils@1.1.1

## 1.2.3

### Patch Changes

- 0d42f0f: fix: resolve workspace: protocol in published dependencies
  - tast-ui: change `@nimoh-digital-solutions/tast-utils` from `workspace:^` to `^1.1.0` in runtime `dependencies` — fixes `YN0001: workspace:^` error for any project installing tast-ui
  - tast-hooks: same fix for `@nimoh-digital-solutions/tast-utils`
  - create-tast-app: banner now shows the actual published version instead of hardcoded v1.0.0
  - All packages: add `"tag": "latest"` to publishConfig so the `@latest` dist-tag is always updated on publish

## 1.2.2

### Patch Changes

- 0896abe: feat(ThemeContext): add `preferredTheme` + `setPreferredTheme` to ThemeProvider
  - New `app-theme-preferred` localStorage key stores the user's explicit default theme
  - On init and OS dark-mode change events, a stored preference of `dim` overrides the OS dark → `dark` fallback, initialising as `dim` instead
  - `ThemeContextValue` now exposes `preferredTheme: Theme | null` and `setPreferredTheme(theme: Theme | null): void`
  - Setting `preferredTheme` to `null` clears the persisted preference

## 1.2.1

### Patch Changes

- ec865eb: chore: add Storybook for isolated component development
  - Install Storybook 10 with @storybook/react-vite builder
  - Configure SCSS/PostCSS pipeline (postcss-jit-props + open-props) and @styles alias to match Vite build
  - Add theme toolbar decorator for light / dim / dark switching via data-theme attribute
  - Add \*.stories.tsx for all 8 components: Button, Input, Textarea, Badge, Spinner, Card, Modal, Toast
  - Add `storybook` and `storybook:build` scripts to workspace and root package.json

## 1.2.0

### Minor Changes

- da7509e: feat: add Input, Textarea, Badge, Spinner, Card, Modal, and Toast components

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
