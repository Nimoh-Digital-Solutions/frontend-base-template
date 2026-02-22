# TAST Frontend Template — Codebase Analysis

> A thorough audit of the template as implemented across all 6 phases.

---

## 1. Architecture Overview

The repository serves a dual purpose:

1. **GitHub Template** — used directly as a starting point for new React apps via `Use this template` or `npx @nimoh-digital-solutions/create-tast-app`
2. **Monorepo source** — home to 8 published npm packages consumed by all apps scaffolded from the template

```
tast-fe-app/
├── src/                         ← App shell (template surface)
├── packages/                    ← Published npm packages (Yarn Workspaces)
│   ├── eslint-config/
│   ├── tsconfig/
│   ├── stylelint-config/
│   ├── tast-styles/
│   ├── tast-utils/
│   ├── tast-hooks/
│   ├── tast-ui/
│   └── create-tast-app/
├── scripts/                     ← Interactive opt-out setup scripts
├── .github/workflows/           ← CI + Changesets release automation
└── .changeset/                  ← Changeset files (versioning)
```

---

## 2. Package Inventory

### Config Packages (source-only, no build)

| Package | Version | Purpose |
|---|---|---|
| `@nimoh-digital-solutions/eslint-config` | 1.0.0 | Shared ESLint ruleset (React, a11y, TypeScript, Prettier) |
| `@nimoh-digital-solutions/tsconfig` | 1.0.0 | Shared `base.json` tsconfig (strict, ESNext, bundler resolution) |
| `@nimoh-digital-solutions/stylelint-config` | 1.0.0 | Shared Stylelint ruleset (standard + SCSS) |

### Runtime Packages (built, published with types)

| Package | Version | Build tool | Output |
|---|---|---|---|
| `@nimoh-digital-solutions/tast-styles` | 1.0.0 | source-only | Raw SCSS files |
| `@nimoh-digital-solutions/tast-utils` | 1.0.0 | tsup | ESM + `.d.ts` |
| `@nimoh-digital-solutions/tast-hooks` | 1.0.0 | tsup | ESM + `.d.ts` |
| `@nimoh-digital-solutions/tast-ui` | 1.0.0 | Vite lib | ESM + CSS + `.d.ts` |
| `@nimoh-digital-solutions/create-tast-app` | 1.0.0 | tsup CJS | `dist/index.cjs` (npx-ready) |

### `tast-utils` exports
- `formatters` — `formatCurrency`, `formatDate`, `formatNumber`, `formatFileSize`, `truncateText`
- `helpers` — `cn` (clsx wrapper), `debounce`, `throttle`, `deepClone`, `isEmpty`, `sleep`
- `storage` — `localStorage` read/write/remove with JSON parse safety
- `pwa` — `registerServiceWorker`, `checkForUpdates`
- `_pwa-state` — internal PWA update state (exported for app consumption)
- `types` — `ApiResponse<T>`, `Theme`, `PaginatedResponse<T>`, `AsyncState<T>`
- `createHttpClient` / `HttpClient` / `HttpError` — typed Fetch-based HTTP client factory

### `tast-hooks` exports
- `useLocalStorage<T>(key, initialValue)` — synced localStorage with functional updates
- `useDocumentTitle(title, appName?)` — sets `document.title`, resets on unmount

### `tast-ui` exports
- **Components:** `Button`, `ErrorBoundary`, `ProtectedRoute`
- **Context:** `ThemeProvider`, `useThemeContext`, `useTheme`

---

## 3. App Shell Structure (`src/`)

```
src/
├── App.tsx                  ← Root: ErrorBoundary > ThemeProvider > AppRouter
├── main.tsx                 ← StrictMode, initPWA(), root mount with guard
├── assets/                  ← Static assets index
├── components/
│   ├── common/              ← ErrorBoundary, ProtectedRoute (thin re-exports from tast-ui)
│   ├── ui/                  ← Button (thin re-export from tast-ui)
│   └── layout/              ← Header, Footer (app-specific layout components)
├── configs/
│   └── appConfig.ts         ← APP_CONFIG: {apiUrl, appName} from VITE_* env vars
├── contexts/
│   └── ThemeContext.tsx      ← Re-exports ThemeProvider/useThemeContext from tast-ui
├── data/                    ← Static/mock data barrel (empty, ready to fill)
├── features/                ← Feature-sliced directory (README inside guides usage)
├── hooks/
│   ├── useLocalStorage.ts   ← Re-export from tast-hooks
│   ├── useDocumentTitle.ts  ← Thin wrapper: calls package hook + injects APP_CONFIG.appName
│   └── useTheme.ts          ← Re-export from tast-ui
├── layouts/
│   └── AppLayout/           ← Shell: Header + <Outlet/> + Footer
├── pages/
│   ├── HomePage/            ← Landing page (lazy-loaded)
│   ├── ComponentsDemoPage/  ← Demo of tast-ui components (lazy-loaded)
│   └── NotFoundPage/        ← 404 page (lazy-loaded)
├── routes/
│   ├── AppRouter.tsx        ← createBrowserRouter + RouterProvider
│   └── config/
│       ├── paths.ts         ← PATHS constants + routeMetadata map
│       └── routesConfig.tsx ← Route tree with Suspense + lazy() splits
├── services/
│   └── http.ts              ← createHttpClient(APP_CONFIG.apiUrl) + re-exports HttpError
├── styles/                  ← Global SCSS architecture
│   ├── index.scss           ← Single import point
│   ├── abstracts/           ← Variables, mixins, functions, animations
│   ├── base/                ← CSS resets
│   ├── layout/              ← Layout utilities
│   ├── pages/               ← Page-specific styles
│   ├── themes/              ← _base.scss, _dark.scss (CSS custom property tokens)
│   └── vendors/             ← Third-party overrides
├── sw/
│   └── pwa.ts               ← Service worker init/update logic
├── test/
│   └── setup.ts             ← Vitest setup: @testing-library/jest-dom matchers
├── types/
│   ├── common.ts            ← App-local types
│   └── index.ts             ← Re-exports types from tast-utils
└── utils/
    ├── index.ts             ← Re-exports all from tast-utils
    └── [formatters, helpers, storage, pwa].ts ← Also kept locally (tast-utils is the canonical source)
```

### Key architectural decisions

- **Thin wrapper pattern** — `src/hooks/`, `src/components/`, `src/contexts/`, and `src/utils/` re-export from packages. App code imports from `@hooks/useTheme`, not directly from `tast-ui`. This means swapping or extending a package requires a change to one file.
- **Route-level code splitting** — all pages are `lazy()`-loaded behind `<Suspense>`. No page code is in the initial bundle.
- **App-level HTTP client** — `src/services/http.ts` instantiates `createHttpClient` once with `APP_CONFIG.apiUrl`. Feature services import from `@services`.
- **Circular import prevention** — `routeMetadata` lives in `paths.ts` (not `routesConfig.tsx`) to break the `AppLayout → Header → routes` cycle.

---

## 4. TypeScript Configuration

### Strictness (`packages/tsconfig/base.json`)
```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitReturns": true,
  "exactOptionalPropertyTypes": true
}
```
`noUncheckedIndexedAccess` is the notable addition over standard strict mode — array/object index access always returns `T | undefined`, forcing explicit null handling.

### Path aliases (root `tsconfig.json`)
All `src/` subdirectories are aliased: `@components`, `@hooks`, `@utils`, `@services`, `@pages`, `@routes`, `@layouts`, `@styles`, `@contexts`, `@configs`, `@data`, `@features`, `@assets`, `@types`.

Workspace packages are also mapped to source for `tsc --noEmit` to work in CI without pre-building dist/:
```json
"@nimoh-digital-solutions/tast-utils": ["../packages/tast-utils/src/index.ts"]
```

### ts-reset
`@total-typescript/ts-reset` is applied via `reset.d.ts` — improves several standard library types (e.g. `JSON.parse` returns `unknown` instead of `any`, `.filter(Boolean)` correctly narrows arrays).

---

## 5. Styling System

Architecture follows the **7-1 SCSS pattern** simplified to 5 layers:

```
styles/
├── abstracts/    ← Design tokens: _variables.scss (CSS custom props), _mixins.scss, _functions.scss, _animations.scss, _utils.scss
├── base/         ← _resets.scss (modern CSS reset)
├── layout/       ← Global layout utilities
├── themes/       ← _base.scss (light, default), _dark.scss — both as CSS custom property declarations on :root / [data-theme="dark"]
└── vendors/      ← Third-party CSS overrides
```

**Theme system:** Light/dark is CSS custom properties only — no class toggling, no SCSS variable switching. `ThemeProvider` toggles `data-theme="dark"` on `<html>`. All component styles reference `--color-*`, `--spacing-*`, `--font-*` tokens.

**PostCSS pipeline:** `autoprefixer` + `postcss-pxtorem` (converts `px` to `rem` in built output automatically).

---

## 6. Testing Setup

| Tool | Version | Coverage |
|---|---|---|
| Vitest | ^4.0.18 | Unit + integration |
| @testing-library/react | ^16.3.2 | Component rendering |
| @testing-library/user-event | ^14.6.1 | User interaction simulation |
| @testing-library/jest-dom | ^6.9.1 | DOM assertion matchers |
| jsdom | ^28.0.0 | DOM environment |
| @vitest/coverage-v8 | ^4.0.18 | Coverage (run with `test:coverage`) |

**Current status:** 182/182 tests passing.

### What's tested (app shell)
- `Button` component (21 tests) — variants, states, props, accessibility
- `ErrorBoundary` (5 tests) — renders children, catches errors, shows fallback
- `ProtectedRoute` (5 tests) — redirects unauthenticated, renders authenticated
- `ThemeContext` (13 tests) — provider, toggle, persistence, system preference
- `useLocalStorage` (10 tests) — reads, writes, functional updates, type safety
- `useDocumentTitle` (3 tests) — sets title, appName prefix, cleanup
- `useTheme` (5 tests) — returns context, toggle works
- `http.ts` service (11 tests) — request methods, error handling, HttpError
- `formatters.ts` (varies) — all formatter functions
- `helpers.ts` (varies) — all utility functions
- `storage.ts` (varies) — localStorage wrapper
- `pwa.ts` (varies) — service worker registration

---

## 7. Build & Tooling

### Vite config highlights
- **Environment detection:** `isProd`, `isTest`, `isDocker` (from `process.env.DOCKER`) flags
- **PWA strategy:** Always on in production; opt-in in dev via `VITE_PWA=true`
- **Bundle analysis:** `yarn build:analyze` opens `rollup-plugin-visualizer` treemap
- **Path aliases:** All `@*` aliases replicated in Vite config to match tsconfig
- **SCSS preprocessor:** Sass compiled; PostCSS runs autoprefixer + pxtorem after
- **Type safety at build time:** `vite-plugin-checker` runs TypeScript + ESLint errors in the dev overlay

### Scripts reference
```
dev             Start Vite dev server
build           TypeScript check + Vite production build
build:analyze   Production build + bundle visualiser
preview         Serve built output locally
type-check      tsc --noEmit (no emit, just check)
lint            ESLint on src/
lint:fix        ESLint with auto-fix
stylelint       Stylelint on src/**/*.scss
stylelint:fix   Stylelint with auto-fix
format          Prettier on entire repo
test            Vitest watch mode
test:run        Vitest single run (CI)
test:coverage   Coverage report (v8)
test:ui         Vitest browser UI
check           Full audit: type-check + lint + stylelint + test:run
check:fix       Auto-fix: lint + stylelint + format
packages:build  Build all 4 runtime packages
packages:typecheck  Typecheck tast-utils, tast-hooks, tast-ui
changeset       Describe a package change (interactive)
changeset:version   Bump versions + write changelogs
changeset:publish   Build packages + publish to GitHub Packages
setup           Interactive opt-out of PWA / Docker / Husky / Testing
setup:pwa       Remove PWA support
setup:docker    Remove Docker support
setup:husky     Remove Husky git hooks
setup:testing   Remove testing setup
setup:docker    Remove Docker config
```

---

## 8. Git & Code Quality Gates

### Pre-commit (Husky + lint-staged)
Runs automatically on staged files before every commit:
- `*.{js,jsx,ts,tsx}` → `eslint --fix` + `prettier --write`
- `*.{css,scss}` → `stylelint --fix` + `prettier --write`
- `*.{json,md,yml,yaml}` → `prettier --write`

### Commit message format (commitlint)
Enforces Conventional Commits: `type(scope): description`
`feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`, `build`, `perf`, `style`

### `.editorconfig`
Consistent formatting across editors: 2-space indent, LF line endings, UTF-8, trim trailing whitespace, final newline.

---

## 9. CI/CD Pipelines

### `ci.yml` (on push + PR to main)
1. Install → Build packages → Type-check → ESLint → Stylelint → Tests

### `release.yml` (on push to main)
1. Install → Write GitHub Packages auth token to `$RUNNER_TEMP/.npmrc` → Build packages
2. `changesets/action@v1`:
   - If unreleased changesets exist → opens/updates **"Version Packages" PR**
   - If Version Packages PR is merged → runs `yarn changeset:publish` → publishes to GitHub Packages

**Auth note:** Requires `NPM_TOKEN` secret (classic PAT with `write:packages` scope). `GITHUB_TOKEN` alone cannot publish to packages when org-level write permissions are restricted.

---

## 10. Optional Features & Setup Scripts

All optional features ship **included** in the template and can be interactively removed:

| Feature | Files | Script |
|---|---|---|
| PWA | `plugins/pwa.ts`, `src/sw/`, `manifest.webmanifest`, `public/icons/` | `yarn setup:pwa` |
| Docker | `Dockerfile`, `docker-compose.yml`, `nginx.conf`, `.dockerignore` | `yarn setup:docker` |
| Husky | `.husky/`, `prepare` script, `lint-staged` config | `yarn setup:husky` |
| Testing | Vitest config, `src/test/` | `yarn setup:testing` |

Each setup script is also exported as `apply({ keep, selfDestruct })` — used internally by `create-tast-app` to remove features based on user prompts during scaffolding.

---

## 11. Known Limitations & Considerations

| Area | Detail |
|---|---|
| **Yarn v1** | Workspaces use `workspace:*` syntax unsupported in Yarn 1 — all cross-package refs use `"*"` instead |
| **GitHub Packages auth** | Consumers need an `.npmrc` with `@nimoh-digital-solutions:registry=https://npm.pkg.github.com` + a PAT with `read:packages` scope |
| **SCSS in tast-ui** | Uses a `@styles` Vite alias pointing to `tast-styles/src`. Consumers that are not Vite-based would need to handle this alias manually |
| **publish.yml removed** | The manual `workflow_dispatch` publish workflow was superseded by Changesets and removed |
| **`src/utils/` duplication** | Local `formatters.ts`, `helpers.ts` etc. exist alongside the `tast-utils` re-export in `utils/index.ts`. The local files are the source of truth for the published package; the index re-exports them |
| **coverage/ in repo** | The `coverage/` directory is not gitignored — add it to `.gitignore` if coverage reports should not be committed |
