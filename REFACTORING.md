# Refactoring Action Plan — `tast-fe-app`

> Analysis date: February 19, 2026  
> Scope: Duplicate code · Unused exports · Error handling · Security · Architecture

---

## TIER 1 — Fix Now (Bugs & Active Security Issues) ✅ COMPLETED

> All 7 items in this tier have been resolved.

### S1 — Upgrade Node 18 → Node 22 ✅

**Files changed:** `Dockerfile:5`, `docker-compose.yml:6`

Upgraded `FROM node:18-alpine` → `FROM node:22-alpine` in both files. Node 18 was EOL since April 2025.

---

### S2 — Nginx production container runs as root ✅

**Files changed:** `Dockerfile`, `docker-compose.yml`, `nginx.conf`, `.dockerignore` (created)

- Switched production stage to `FROM nginxinc/nginx-unprivileged:alpine` (runs nginx worker as non-root `nginx` user).
- Updated `nginx.conf` to `listen 8080` (unprivileged processes cannot bind to ports <1024).
- Updated `EXPOSE 80` → `EXPOSE 8080` and healthcheck URL to `http://localhost:8080/health` in Dockerfile.
- Updated `docker-compose.yml` prod port mapping from `8080:80` → `8080:8080`.
- Created `.dockerignore` to prevent `.env` files and secrets from being baked into image layers.

---

### S3 — Add HSTS / HTTPS enforcement header to nginx ✅

**File changed:** `nginx.conf`

Added after existing security headers:
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

---

### B1 — `AppLayout.module.scss` global tag selectors leak styles ✅

**Files changed:** `src/layouts/AppLayout/AppLayout.module.scss`, `src/layouts/AppLayout/AppLayout.tsx`, `src/components/Header/Header.tsx`, `src/components/Footer/Footer.tsx`

- Replaced bare `header, main, footer` selectors with scoped `.header, .main, .footer` class selectors in `AppLayout.module.scss`.
- Updated `AppLayout.tsx` to pass `className={styles.header}` and `className={styles.footer}` to the `<Header />` and `<Footer />` components.
- Added `className?: string` prop to both `Header` and `Footer` components, merged with their internal `styles.root`.

---

### B2 — Wrong `@types/react-router-dom` package installed ✅

**File changed:** `package.json`, `yarn.lock`

Removed `@types/react-router-dom@^5.3.3` via `yarn remove`. React Router DOM v7 ships its own type declarations; the v5 types were entirely incompatible.

---

### B3 — `NotFoundPage` has unused dead imports — no "Back to Home" link ✅

**Files changed:** `src/pages/NotFoundPage/NotFoundPage.tsx`, `src/pages/NotFoundPage/NotFoundPage.module.scss`

- Added a `<Link to={PATHS.HOME}>← Back to Home</Link>` element to the 404 page, wiring the pre-existing but unused `Link` and `PATHS` imports.
- Added `.backLink` style to `NotFoundPage.module.scss`.

---

### B4 — Silent blank screen when `#root` is missing ✅

**File changed:** `src/main.tsx`

Replaced the silent `root?.render(...)` no-op with a hard throw:
```typescript
if (!container) {
  throw new Error('[main] #root element not found — check index.html');
}
```

---

### B5 — Unhandled promise rejection on service worker unregister ✅

**File changed:** `src/sw/pwa.ts`

Added `.catch()` to the fire-and-forget `unregisterServiceWorkers()` call:
```typescript
unregisterServiceWorkers().catch(err =>
  console.warn('Failed to unregister service workers:', err)
);
```

---

## TIER 2 — High-Value Template Gaps ✅ COMPLETED

> All 10 items in this tier have been resolved.

### T1 — Add `ErrorBoundary` component ✅

**Files created/changed:** `src/components/ErrorBoundary/ErrorBoundary.tsx` (new), `src/components/ErrorBoundary/index.ts` (new), `src/components/index.ts`, `src/App.tsx`

- Created a class-based `ErrorBoundary` component with `fallback` prop and `console.error` logging (swap for Sentry/Datadog as needed).
- Exported it through the components barrel.
- Wrapped `<AppRouter />` in `<ErrorBoundary>` in `src/App.tsx` — any unhandled render error now shows "Something went wrong" rather than a blank page.

---

### T2 — Add `env.d.ts` and `.env.example` ✅

**Files changed:** `src/vite-env.d.ts`, `.env.example` (new)

- Extended `src/vite-env.d.ts` with a typed `ImportMetaEnv` interface declaring `VITE_API_URL`, `VITE_APP_TITLE`, and `VITE_PWA`. All `import.meta.env.VITE_*` accesses are now fully typed — no more `any`.
- Created `.env.example` documenting every variable the app expects. New developers get a clear starting point with no silent `undefined` surprises.
- Also fixed `vite.config.ts` to use `loadEnv(mode, cwd(), 'VITE_')` (prefix filter) instead of `''` (which loaded all process env vars including CI secrets). `isDocker` now reads from `process.env['DOCKER']` directly.

---

### T3 — Add route-level lazy loading ✅

**File changed:** `src/routes/config/routesConfig.tsx`

- Replaced all three eager page imports with `React.lazy()`:
  - `HomePage` — `lazy(() => import('@pages/HomePage/HomePage'))`
  - `ComponentsDemoPage` — `lazy(() => import('...').then(m => ({ default: m.ComponentsDemoPage })))` (named export)
  - `NotFoundPage` — `lazy(() => import('@pages/NotFoundPage/NotFoundPage'))`
- Each route element is wrapped in `<Suspense fallback={<PageFallback />}>`. A minimal inline `PageFallback` component is included; replace with a branded `<PageLoader />` as the project grows.
- Each page chunk is now only fetched when that route is first visited, reducing initial bundle size.

---

### T4 — Wire `routeMetadata` for `document.title` updates ✅

**Files created/changed:** `src/hooks/useDocumentTitle.ts` (new), `src/hooks/index.ts`, `src/pages/HomePage/HomePage.tsx`, `src/pages/ComponentsDemoPage/ComponentsDemoPage.tsx`, `src/pages/NotFoundPage/NotFoundPage.tsx`

- Created `useDocumentTitle(title: string)` hook — sets `document.title` to `"<title> | <APP_NAME>"` on mount and restores the previous title on unmount.
- Exported from the hooks barrel.
- Added `useDocumentTitle(...)` calls at the top of all three page components with their respective titles matching `routeMetadata`.

---

### T5 — Fix CSP `connect-src` wildcard (`https://api.*` is invalid) ✅

**File changed:** `nginx.conf`

Replaced `https://api.*` (invalid CSP — browsers match it as a literal hostname, not a wildcard) with `https://api.example.com` and added a comment instructing teams to replace this with the actual API base URL. Also updated the surrounding CSP comment block.

---

### T6 — Remove `'unsafe-inline'` from CSP `style-src` ✅

**File changed:** `nginx.conf`

Removed `'unsafe-inline'` from `style-src`. Vite+SCSS extracts all styles to static `.css` files — inline styles are not needed. Removing this closes the CSS injection vector.

---

### T7 — Add vendor chunk splitting to Vite build ✅

**File changed:** `vite.config.ts`

Added `rollupOptions.output.manualChunks` to the build config:
```typescript
manualChunks: {
  vendor: ['react', 'react-dom'],
  router: ['react-router-dom'],
}
```
`react`+`react-dom` (~150 KB gzip) and `react-router-dom` now ship in separate, long-lived chunks. A new deploy only invalidates the app code chunk — vendors stay cached.

---

### T8 — Add `localStorage.clear()` to test setup ✅

**File changed:** `src/test/setup.ts`

Added `beforeEach(() => localStorage.clear())`. jsdom persists `localStorage` between tests in the same process; without this, `useLocalStorage` tests leak state into each other and produce order-dependent failures.

---

### T9 — Consolidate PWA code — remove dead barrel ✅

**Action:** deleted `src/pwa/index.ts` and `src/pwa/` directory.

`src/pwa/index.ts` re-exported from `src/sw/pwa.ts`, but `main.tsx` already imports `initPWA` directly from `./sw/pwa` — the barrel was imported by nothing. Removed the dead file and directory. PWA code now has exactly two locations: `src/sw/pwa.ts` (registration/update logic) and `src/utils/pwa.ts` (utilities/detection).

---

### T10 — Drive `Header` nav links from `PATHS` constants ✅

**Files created/changed:** `src/routes/config/paths.ts` (new), `src/routes/config/routesConfig.tsx`, `src/components/Header/Header.tsx`

- Extracted `PATHS` into its own file `src/routes/config/paths.ts` to break the circular dependency: `routesConfig → AppLayout → Header → routesConfig`.
- `routesConfig.tsx` now imports `PATHS` from `./paths` and re-exports it for backward compatibility.
- `Header.tsx` imports `PATHS` via `@routes/config/paths` (no app component chain, no circular dep) and uses `PATHS.HOME` and `PATHS.COMPONENTS_DEMO` instead of the former hardcoded string literals `'/'` and `'/components'`. Renaming a route now only requires changing `paths.ts`.

---

## TIER 3 — Code Quality & Maintainability ✅ COMPLETED

> All 8 items in this tier have been resolved.

### Q1 — Extract 5 repeated SCSS patterns into mixins ✅

**Target:** `src/styles/abstracts/_mixins.scss`

| Mixin | Instances Eliminated |
|---|---|
| `card-block($padding, $radius)` | 7 across 4 module files |
| `full-page-flex-col` | 2 — AppLayout, NotFoundPage |
| `filled-button-variant($color-key)` | 5 variants in `Button.module.scss` |
| `auto-grid($min-width, $gap)` | 4 across 2 page modules |
| `centered-prose($max-width)` | 2 across 2 page modules |

**Action:** Added all 5 mixins to `src/styles/abstracts/_mixins.scss` and applied them to every consuming module:
- `Button.module.scss` — 5 filled variants now use `@include mixin.filled-button-variant('X')` (removed ~50 lines of repeated hover/active blocks)
- `AppLayout.module.scss` — `.root` uses `full-page-flex-col`; `.header/.main/.footer` use `card-block`
- `NotFoundPage.module.scss` — `.root` uses `full-page-flex-col`; `.errorSection` and `.errorContent` use `card-block('6')`
- `HomePage.module.scss` — `.hero`/`.features`/`.featureCard` use `card-block`; `.featuresGrid` uses `auto-grid`; `.heroSubtitle` uses `centered-prose`
- `ComponentsDemoPage.module.scss` — `.buttonGrid`/`.interactiveGrid`/`.accessibilityList` use `auto-grid`; `.header p` uses `centered-prose`

```scss
// Added to _mixins.scss

@mixin card-block($padding-key: '4', $radius-key: 'sm') {
  border: 1px solid func.color('primary-light');
  background: func.color('white');
  border-radius: func.border-radius($radius-key);
  padding: func.spacing($padding-key);
}

@mixin full-page-flex-col {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: func.color('white');
}

@mixin filled-button-variant($color-key) {
  background-color: func.color($color-key);
  color: func.color('white');
  border-color: func.color($color-key);

  &:hover:not(:disabled, &.disabled) {
    background-color: func.shade(func.color($color-key), 10%);
    border-color: func.shade(func.color($color-key), 10%);
  }
  &:active:not(:disabled, &.disabled) {
    background-color: func.shade(func.color($color-key), 15%);
    border-color: func.shade(func.color($color-key), 15%);
  }
}

@mixin auto-grid($min-width: 250px, $gap-key: '4') {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax($min-width, 1fr));
  gap: func.spacing($gap-key);
}

@mixin centered-prose($max-width: 600px) {
  max-width: $max-width;
  margin-left: auto;
  margin-right: auto;
}
```

---

### Q2 — Extract `trySyncStorage` helper in `storage.ts` ✅

**File:** `src/utils/storage.ts`

Added a private `trySyncStorage(op: () => void, warnMsg: string): boolean` helper. The 4 copy-pasted `try/catch/return` blocks in `setStorageItem`, `removeStorageItem`, `clearStorage` are now replaced with single `trySyncStorage` calls. Net reduction: ~30 lines.

---

### Q3 — Extract `ButtonIcon` internal component in `Button.tsx` ✅

**File:** `src/components/Button/Button.tsx`

Added `const ButtonIcon = ({ children }: { children: ReactNode }) => (...)` before the `forwardRef` and replaced all 3 `<span className={styles.icon} aria-hidden="true">` occurrences with `<ButtonIcon>`. Also added `ReactNode` to the React import.

---

### Q4 — Move PWA types into `types/pwa.ts`, not `utils/pwa.ts` ✅

**Files:** `src/utils/pwa.ts`, `src/types/pwa.ts`

Moved `DisplayMode`, `ConnectionType`, and `BeforeInstallPromptEventLike` to `src/types/pwa.ts`. `utils/pwa.ts` now re-exports them from `@types/pwa`. `PWAManifest.display` field updated to use the `DisplayMode` type alias.

---

### Q5 — Replace `navigator as any` with typed interface extension ✅

**File:** `src/utils/pwa.ts`

Added `NavigatorExtended` interface extending `Navigator` with `standalone?`, `maxTouchPoints`, and `connection?`. All 3 `(navigator as any)` casts replaced with `(navigator as NavigatorExtended)`.

---

### Q6 — Fix `loadEnv` to use `VITE_` prefix ✅

**File:** `vite.config.ts`

Resolved in Tier 2 (T2). `loadEnv` now uses `'VITE_'` prefix; `isDocker` reads from `process.env['DOCKER']` directly.

---

### Q7 — Add `useLocalStorage` error state for write failures ✅

**File:** `src/hooks/useLocalStorage.ts`

Added `writeError: boolean` state. `setStoredValue` now captures the return value of `setStorageItem` and calls `setWriteError(!ok)`. Return tuple updated to `[value, setStoredValue, writeError] as const`.

---

### Q8 — Guard against sensitive keys in `setStorageItem` ✅

**File:** `src/utils/storage.ts`

Added `SENSITIVE_KEY_PATTERNS = [/token/i, /secret/i, /password/i, /auth/i]` and a private `isSensitiveKey()` guard. `setStorageItem` now rejects and logs an error for any key matching the patterns.

---

## TIER 4 — Structural Improvements (Template Completeness) ✅ COMPLETED

> All 8 items in this tier have been resolved.

### T4-1 — `ThemeContext` + `useTheme` hook ✅

**Files created/changed:** `src/contexts/ThemeContext.tsx` (new), `src/contexts/index.ts`, `src/hooks/useTheme.ts` (new), `src/hooks/index.ts`, `src/App.tsx`

- Created `ThemeContext` with `ThemeProvider` component. Provider persists the active theme to `localStorage`, respects the OS `prefers-color-scheme` preference on first load, and applies `data-theme="<theme>"` to `<html>` so SCSS `[data-theme]` selectors take effect globally.
- Created `useTheme()` hook (in `src/hooks/`) — wraps `useThemeContext` and adds `isDark`/`isLight` convenience flags.
- Exported both from their respective barrels.
- Wrapped `<App />` contents in `<ThemeProvider>`.

---

### T4-2 — Dark theme SCSS (`_dark.scss`) ✅

**Files created/changed:** `src/styles/themes/_dark.scss` (new), `src/styles/themes/_index.scss`

- Created `_dark.scss` — overrides all semantic CSS custom properties under `[data-theme="dark"]`. Swaps backgrounds (`gray-950`/`gray-900`), text colours (`whiteish`/`blackish`), borders (`gray-700`), and lightens core palette tokens for readability on dark surfaces.
- Forwarded `_dark` from `themes/_index.scss`.
- **Migration note** (in file): existing module files that use raw palette tokens (`'white'`, `'whiteish'`) instead of semantic tokens (`'bg-card'`, `'bg-body'`) will need to be updated per-component to fully adopt dark mode.

---

### T4-3 — `services/` directory + HTTP client ✅

**Files created/changed:** `src/services/http.ts` (new), `src/services/index.ts` (new), `vite.config.ts`, `tsconfig.json`

- Created typed `http` client (native `fetch`) with `get`, `post`, `put`, `patch`, `delete` methods. Reads base URL from `APP_CONFIG.apiUrl`. All methods return `ApiResponse<T>`; non-2xx responses throw the new `HttpError` class (carries `status` + parsed `body`).
- Created `src/services/index.ts` barrel — `export { http, HttpError }`.
- Added `@services` path alias to `vite.config.ts` and `tsconfig.json`.

---

### T4-4 — `ProtectedRoute` component ✅

**Files created:** `src/components/common/ProtectedRoute/ProtectedRoute.tsx`, `src/components/common/ProtectedRoute/index.ts`

- Created `ProtectedRoute` — wraps a route behind an `isAuthenticated: boolean` prop. Redirects unauthenticated visitors to `redirectTo` (default `PATHS.HOME`) via `<Navigate replace />`.
- Includes JSDoc with usage example and a migration note explaining how to wire `isAuthenticated` from an auth context once one exists.
- Exported from `src/components/common/index.ts` and therefore from `@components`.

---

### T4-5 — Reorganise `components/` into subfolders ✅

**Files moved/created:** `src/components/{ui,layout,common}/` directories + barrel files; `src/components/index.ts` updated

- Physically moved component folders into three categories:
  - `ui/` — `Button` (primitive, stateless building blocks)
  - `layout/` — `Header`, `Footer` (structural chrome)
  - `common/` — `ErrorBoundary`, `ProtectedRoute` (composite cross-cutting)
- Created `src/components/{ui,layout,common}/index.ts` category barrels.
- Updated `src/components/index.ts` to re-export from all three sub-barrels — all existing `@components` consumers continue to work without changes.

---

### T4-6 — `src/features/` scaffolding note ✅

**Files created:** `src/features/README.md`

- Created `src/features/README.md` documenting the feature module pattern: directory anatomy, import rules (barrel-only, no cross-feature deps), the "graduate shared code" rule, lazy-loading contract, and example barrel.
- Also added `@features` path alias to `vite.config.ts` and `tsconfig.json` so the first feature module can be imported as `@features/<name>` without further config changes.

---

### T4-7 — `build.sourcemap: 'hidden'` ✅

**File changed:** `vite.config.ts`

Added `sourcemap: 'hidden'` to the `build` config. Hidden source maps are generated and written to `dist/*.map` files but are not referenced by the bundle — they are invisible to end-users yet available for upload to Sentry / Datadog for production error symbolication.

---

### T4-8 — `rollup-plugin-visualizer` ✅

**Files changed:** `vite.config.ts`, `package.json`; **installed:** `rollup-plugin-visualizer@6.0.5`

- Added `visualizer({ open: true, filename: 'dist/stats.html', gzipSize: true, brotliSize: true })` to the plugins array, guarded behind `mode === 'analyze'` so it never runs in normal builds.
- Added `"build:analyze": "tsc && vite build --mode analyze"` script to `package.json`.
- Run `yarn build:analyze` to build and auto-open `dist/stats.html` in the browser for chunk size inspection.

---

## Dead Code — Remove Immediately ✅ COMPLETED

> All 8 items resolved.

| Item | Resolution |
|---|---|
| Unused `router` named export — `AppRouter.tsx` | Dropped `export` keyword; `router` is now a private `const` internal to the file |
| Unused `routeMetadata` export — `routesConfig.tsx` | Moved to `paths.ts` (co-located with `PATHS`); all 3 pages now import and consume it via `useDocumentTitle(routeMetadata[PATHS.X].title)` |
| Dead `src/pwa/index.ts` barrel | Deleted in Tier 2 (T9) |
| `Link` + `PATHS` unused imports in `NotFoundPage` | Wired in Tier 1 (B3) — now powers the "← Back to Home" link |
| Empty `src/contexts/index.ts` | Populated in Tier 4 (T4-1) — exports `ThemeProvider`, `useThemeContext`, `ThemeContext` |
| Empty `src/data/index.ts` | Added a scaffold comment; barrel kept so the `@data` alias stays valid as the data layer grows |
| Placeholder-only `src/assets/index.ts` | Added usage example comment; barrel kept so the `@assets` alias stays valid |
| `@types/react-router-dom@^5.3.3` in `devDependencies` | Removed in Tier 1 (B2) via `yarn remove` |

---

## Summary

| Priority | Count | Status |
|---|---|---|
| **Tier 1 — Fix Now** | 7 items | ✅ All completed |
| **Tier 2 — Template Gaps** | 10 items | ✅ All completed |
| **Tier 3 — Code Quality** | 8 items | ✅ All completed |
| **Tier 4 — Structural** | 8 items | ✅ All completed |
| **Dead code removals** | 8 items | ✅ All completed |
| **Final Audit — Critical** | 9 items | ✅ All completed |
| **Final Audit — Major** | 20 items | ⬜ Pending |
| **Final Audit — Minor** | 20 items | ⬜ Pending |

---

## Final Audit — Pre-Release Deep Sweep

> Analysis date: February 19, 2026  
> Three parallel audits: TypeScript & code quality · Test coverage · Security, accessibility & configuration

---

## FA-CRITICAL — Fix Before Building Anything ✅

### FA-C1 ✅ — nginx `add_header` inheritance drops all security headers in practice

**File:** `nginx.conf`

In nginx, any `add_header` directive inside a `location` block **completely overrides (does not inherit) all `add_header` directives from the parent `server` block**. Every location block that sets a `Cache-Control` header (all of them: `/`, `/index.html`, `sw.js`, `/assets/`, etc.) is currently serving **zero** security headers — no CSP, no HSTS, no `X-Frame-Options`, no `X-Content-Type-Options`. The entire security header suite only activates for requests that match no location block at all.

**Fix:** Extract all security headers into a shared `includes/security_headers.conf` file and `include` it inside every `location` block, in addition to the `server` block.

---

### FA-C2 ✅ — `ThemeContext` uses raw `localStorage` — will crash in restricted environments

**File:** `src/contexts/ThemeContext.tsx`

`ThemeProvider` calls `localStorage.getItem` and `localStorage.setItem` directly (lines 52–66). In sandboxed iframes, Safari ITP private browsing, or any environment where storage is blocked, this throws a `DOMException` and crashes the entire app before it can render. The codebase already has `getStorageItem`/`setStorageItem` from `@utils/storage` with full try/catch handling — they should be used here instead.

---

### FA-C3 ✅ — No skip navigation link (WCAG 2.1 SC 2.4.1, Level A)

**File:** `src/layouts/AppLayout/AppLayout.tsx`

There is no skip-to-main-content link. Keyboard and screen reader users must tab through the entire header navigation on every page before reaching the page content. This violates WCAG 2.1 Success Criterion 2.4.1 (Bypass Blocks, Level A — the only A criterion commonly missed). A visually hidden `<a href="#main-content">Skip to main content</a>` as the first child of `AppLayout` resolves this, paired with `id="main-content"` on `<main>`.

---

### FA-C4 ✅ — Nested `<main>` inside `<main>` — invalid HTML, breaks AT landmark navigation

**File:** `src/pages/ComponentsDemoPage/ComponentsDemoPage.tsx`

`AppLayout` renders `<main className={styles.main}>`. `ComponentsDemoPage` renders `<main className={styles.content}>` inside it. The HTML spec allows at most one visible `<main>` element per document. Nested `<main>` elements are invalid, cause screen readers to behave inconsistently with landmark navigation, and will fail automated accessibility audits. The inner element should be `<div>` or `<section>`.

---

### FA-C5 ✅ — `eslint-plugin-jsx-a11y` installed but never configured

**File:** `eslint.config.js`, `package.json`

`eslint-plugin-jsx-a11y@^6.8.0` is in `devDependencies` but has zero presence in `eslint.config.js` — no import, no plugin registration, no rules. Half the accessibility findings in this audit would be caught automatically at lint time if this plugin were active. This is the single most leverage point for preventing future accessibility regressions.

---

### FA-C6 ✅ — `useLocalStorage` `writeError` return value completely untested

**File:** `src/hooks/useLocalStorage.ts` / `src/hooks/useLocalStorage.test.ts`

The hook returns `[value, setValue, writeError]` — the third element was added specifically to surface storage failures. No test ever destructures index 2 or asserts it changes to `true` after a storage failure or resets to `false` on success. The feature is untested end-to-end.

---

### FA-C7 ✅ — Sensitive-key guard in `storage.ts` has zero test coverage

**File:** `src/utils/storage.ts` / `src/utils/storage.test.ts`

`setStorageItem` rejects keys matching `/token/i`, `/secret/i`, `/password/i`, `/auth/i` and returns `false` with `console.error`. Not a single test exercises this path — there are no calls to `setStorageItem('token', x)`, no assertions on the `false` return value, and no spy on `console.error` for this code path.

---

### FA-C8 ✅ — No global `window.matchMedia` mock in test setup

**File:** `src/test/setup.ts`

`ThemeProvider` calls `window.matchMedia('(prefers-color-scheme: dark)')` in its lazy state initialiser. jsdom does not implement `matchMedia`. Any component or hook test that renders a tree containing `<ThemeProvider>` will throw `TypeError: window.matchMedia is not a function` and fail immediately. A global mock in `setup.ts` is required.

---

### FA-C9 ✅ — Zero test files for `ThemeContext`, `http.ts`, `ErrorBoundary`, `ProtectedRoute`

**Files:** `src/contexts/ThemeContext.tsx`, `src/services/http.ts`, `src/components/common/ErrorBoundary/ErrorBoundary.tsx`, `src/components/common/ProtectedRoute/ProtectedRoute.tsx`

Four key pieces of new infrastructure added in Tier 4 have no tests at all:
- `ThemeProvider` — initialisation from localStorage, OS preference fallback, `data-theme` side-effect, `toggleTheme`, `setTheme`, error when used outside provider
- `http.ts` — `HttpError` class (status, body, name), all five methods, non-2xx throws, 204 no-body, content-type headers
- `ErrorBoundary` — renders fallback on error, renders children normally
- `ProtectedRoute` — renders children when authenticated, redirects when not

---

## FA-MAJOR — Fix Before First Real Feature ✅

### FA-M1 ✅ — `X-Frame-Options: SAMEORIGIN` contradicts CSP `frame-ancestors 'none'`

**File:** `nginx.conf`

The server sends both `X-Frame-Options: SAMEORIGIN` (allow same-origin framing) and `Content-Security-Policy: frame-ancestors 'none'` (forbid all framing). These are contradictory. Modern browsers honour `frame-ancestors` and ignore `X-Frame-Options`, but the inconsistency signals unclear intent. Align to one: `X-Frame-Options: DENY` + `frame-ancestors 'none'` (no framing) or `X-Frame-Options: SAMEORIGIN` + `frame-ancestors 'self'` (same-origin framing allowed).

**Fixed:** `X-Frame-Options` aligned to `DENY` in `security_headers.conf` to match `frame-ancestors 'none'`.

---

### FA-M2 ✅ — HSTS `preload` flag is inappropriate for a template

**File:** `nginx.conf`

```nginx
Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
```

The `preload` flag submits the domain to the browser HSTS preload list — a **permanent, irreversible** action. Any developer deploying this template to a production domain without understanding this will lock it into HTTPS-only in all browsers globally, forever. The template should ship without `preload` and include a comment explaining when and how to add it deliberately.

**Fixed:** `preload` removed from HSTS header in `security_headers.conf`; explanatory comment added.

---

### FA-M3 ✅ — Dev Docker container runs as root

**File:** `docker-compose.yml`

The `app` (dev) service uses `node:22-alpine`, which runs as `root` by default. A container compromise escates directly to root access. The production service correctly uses `nginxinc/nginx-unprivileged`. Fix: add `user: node` to the `app` service definition. Also consider adding `security_opt: [no-new-privileges:true]` to match the production service hardening.

**Fixed:** Added `user: node` and `security_opt: [no-new-privileges:true]` to the `app` dev service; removed deprecated `version: '3.8'` key.

---

### FA-M4 ✅ — `tsconfig.json` missing three important strict flags

**File:** `tsconfig.json`

`strict: true` does not cover:
- `noUncheckedIndexedAccess` — array/object index access silently returns `T` not `T | undefined`, masking out-of-bounds bugs
- `noImplicitReturns` — functions with missing return branches are not caught
- `exactOptionalPropertyTypes` — partial optional assignments are allowed, undermining optional typing

These three should be added to `compilerOptions`.

**Fixed:** All three flags added to `tsconfig.json`; downstream `string | undefined` issues in CSS module access, optional prop spreads, and test index access resolved throughout the codebase.

---

### FA-M5 ✅ — `VITE_API_URL` typed as always-defined, but it can be `undefined`

**File:** `src/vite-env.d.ts`

```ts
VITE_API_URL: string;
```

If `VITE_API_URL` is not set, `import.meta.env.VITE_API_URL` returns `undefined` at runtime. Typing it as `string` suppresses all TS guards at call sites. Should be `string | undefined`. Same applied to `VITE_APP_TITLE`. `VITE_PWA` should be `'true' | 'false'` rather than `string`.

**Fixed:** `VITE_API_URL` and `VITE_APP_TITLE` typed as `string | undefined`; `VITE_PWA` typed as `'true' | 'false' | undefined`.

---

### FA-M6 ✅ — `AppConfig` and `Locale` types are dead exports

**File:** `src/types/common.ts`

`AppConfig` and `Locale` are exported but imported nowhere in the codebase. `AppConfig` references `Locale` which is also unused. Remove or wire them to the actual app config.

**Fixed:** Both `AppConfig` and `Locale` removed from `src/types/common.ts`.

---

### FA-M7 ✅ — `console.log` in production code path in `src/sw/pwa.ts`

**File:** `src/sw/pwa.ts`

```ts
console.log('App is ready for offline use')
```

This fires on every service worker activation in production. Should be `console.info` at minimum or removed entirely. The `window.confirm('A new version is available. Update now?')` on line 42 is also a blocking browser dialog — it is inaccessible, unstyled, and suppressed in cross-origin iframes. Should be replaced with a non-blocking notification pattern.

**Fixed:** `console.log` → `console.info('[PWA] App is ready for offline use.')`; `window.confirm` replaced with direct `updateSW(true)` with an explanatory comment.

---

### FA-M8 ✅ — `navLinks` array re-created on every render inside `Header`

**File:** `src/components/layout/Header/Header.tsx`

The `navLinks` array (containing `{ name, path, icon }` objects) is declared inside the `Header` component function body. It contains no reactive values, so it is re-created on every single render. Move it to module scope (outside the component) to create it once.

**Fixed:** `navLinks` moved to module scope in `Header.tsx`.

---

### FA-M9 ✅ — `toggleTheme`/`setTheme` in `ThemeContext` recreated on every render

**File:** `src/contexts/ThemeContext.tsx`

`toggleTheme` and `setTheme` are inline arrow functions created fresh in each render of `ThemeProvider`. Every consumer of the context will re-render on every provider render regardless of whether the theme actually changed. Wrap both with `useCallback`.

**Fixed:** Both `toggleTheme` and `setTheme` wrapped with `useCallback` in `ThemeContext.tsx`.

---

### FA-M10 ✅ — `<nav>` has no accessible label

**File:** `src/components/layout/Header/Header.tsx`

```tsx
<nav className={styles.nav}>
```

An unlabelled `<nav>` gives screen reader users no way to distinguish it from other navigation regions. Add `aria-label="Main navigation"`. WCAG 2.1 SC 4.1.2.

**Fixed:** `aria-label="Main navigation"` added to `<nav>`; decorative SVG icons given `aria-hidden="true"`.

---

### FA-M11 ✅ — Button `loading` state has no accessible announcement

**File:** `src/components/ui/Button/Button.tsx`

The button correctly sets `aria-busy={loading}` and hides the spinner with `aria-hidden="true"`. However, when loading starts, screen readers receive no feedback that an action is in progress. Add `aria-label={loading ? loadingLabel ?? 'Loading, please wait' : undefined}` to the `<button>`, or add an `aria-live="polite"` region. The `loadingLabel` prop can be optional with a sensible default.

**Fixed:** `loadingLabel?: string` prop added to `ButtonProps`; `aria-label={loading && loadingLabel ? loadingLabel : undefined}` wired to the `<button>` element.

---

### FA-M12 ✅ — `deepClone` fallback branch never exercised in tests

**File:** `src/utils/helpers.test.ts`

jsdom exposes `structuredClone` globally, so all `deepClone` tests silently only exercise the early-return branch. The manual fallback (handling `Date`, recursive objects/arrays) and the try/catch recovery path are dead to the test suite. Tests should stub `structuredClone` to throw and verify the fallback runs.

**Fixed:** Nested `describe('manual fallback')` added in `helpers.test.ts`; spies on `globalThis.structuredClone` to throw and covers plain objects, arrays, `Date`, and primitives via fallback path.

---

### FA-M13 ✅ — `crypto.randomUUID` fallback in `generateId` never exercised

**File:** `src/utils/helpers.test.ts`

`generateId` prefers `crypto.randomUUID()`. Tests run in jsdom where `crypto` is available, so the `Math.random` fallback branch is never hit. A test should stub `crypto.randomUUID` to be `undefined` and verify the fallback produces a valid ID string.

**Fixed:** `describe('generateId — Math.random fallback')` added; stubs `crypto.randomUUID` to `undefined` via `vi.stubGlobal` and asserts uniqueness across 50 calls.

---

### FA-M14 ✅ — `getDisplayMode` `standalone`/`fullscreen` branches untested

**File:** `src/utils/pwa.test.ts`

Only `minimal-ui` and `browser` display modes are tested. The `standalone` and `fullscreen` branches are dead to the test suite.

**Fixed:** Individual tests added for `standalone`, `fullscreen`, `minimal-ui`, and `browser` in `pwa.test.ts`.

---

### FA-M15 ✅ — `getAppVersionFromSW` timeout path untested

**File:** `src/utils/pwa.test.ts`

No test simulates the `setTimeout` firing before the service worker responds (i.e. `resolve(null)` timeout path). The timer cleanup code is entirely unexercised.

**Fixed:** Two tests added: one for the timeout path (timer fires before SW responds) and one for non-string SW responses, both using `vi.useFakeTimers()`.

---

### FA-M16 ✅ — Button icon-position tests use fragile DOM index traversal

**File:** `src/components/ui/Button/Button.test.tsx`

Icon-position tests use `button.children` index arithmetic. Any structural refactor that wraps `ButtonIcon` in an additional element will silently break these tests even if the rendered output is visually identical. Use accessible queries (`getByRole`, `getByLabelText`) or `data-testid` instead.

**Fixed:** Icon-position tests rewritten using `compareDocumentPosition` + `data-testid` attributes (`button-icon`, `button-content`); tests verify DOM order without fragile child-index assumptions.

---

### FA-M17 ✅ — `__resetPwaInstallPromptForTests` ships in production bundle

**File:** `src/utils/pwa.ts`

This function is a test-only reset hook exported from production source code purely to allow test isolation. It ships in the production bundle and exposes mutable module state to any caller. Use `vi.mock()` module interception instead, or move mutable state to a separate internal module.

**Fixed:** `__resetPwaInstallPromptForTests` removed; mutable state extracted to `src/utils/_pwa-state.ts`; tests import and reset `pwaState` directly.

---

### FA-M18 ✅ — `eslint-config-react-app` is a dead devDependency

**File:** `package.json`

`eslint-config-react-app@^7.0.1` is in `devDependencies` but is not referenced anywhere in `eslint.config.js`. It targets the legacy `.eslintrc` format and is incompatible with the flat config system in use. Remove it.

**Fixed:** `eslint-config-react-app` removed from `package.json` devDependencies.

---

### FA-M19 ✅ — Spinner not asserted when `loading=true` in Button tests

**File:** `src/components/ui/Button/Button.test.tsx`

There is a test that the icon disappears when `loading=true`, but no test asserts that the spinner element (`ButtonIcon` with `PiSpinnerGapBold`) actually renders in its place.

**Fixed:** Test added asserting `getByTestId('button-spinner')` renders when `loading={true}`; additional test covers `loadingLabel` aria-label override.

---

### FA-M20 ✅ — `useDocumentTitle` and `useTheme` hooks have no test files

**Files:** `src/hooks/useDocumentTitle.ts`, `src/hooks/useTheme.ts`

`useDocumentTitle` — should test: title set on mount, app name appended, previous title restored on unmount.  
`useTheme` — should test: `isDark`/`isLight` flags, delegation to `ThemeContext`.

**Fixed:** `src/hooks/useDocumentTitle.test.ts` (3 tests: mount, update, unmount restore) and `src/hooks/useTheme.test.ts` (5 tests: theme, isDark, isLight, toggleTheme, setTheme) created.

---

## FA-MINOR — Cleanup ✅

| ID | File | Description | Status |
|---|---|---|---|
| FA-m1 | `nginx/security_headers.conf` | `connect-src` included misleading comments referencing Google Fonts (which are `<link>`-loaded, not fetched via XHR) | ✅ Corrected comment; `connect-src` already correct |
| FA-m2 | `src/services/http.ts` | No comment flagging that CSRF token support will be needed once session-cookie auth is wired in | ✅ CSRF note added above public API |
| FA-m3 | `Dockerfile` | Builder base image (`FROM node:22-alpine`) uses a mutable tag; supply-chain hygiene requires pinning to a digest | ✅ Digest-pinning instructions added as comment with `docker inspect` command |
| FA-m4 | `docker-compose.yml` | Deprecated `version: '3.8'` key | ✅ Removed in FA-M3 session |
| FA-m5 | `src/contexts/ThemeContext.tsx` | Bypassed `setStorageItem`/`getStorageItem` | ✅ Fixed in FA-C2 session |
| FA-m6 | `src/sw/pwa.ts` | `window.confirm()` hardcoded user-facing string | ✅ Removed in FA-M7 session |
| FA-m7 | `src/components/layout/Header/Header.tsx` | React-icons SVGs without `aria-hidden="true"` | ✅ Fixed in FA-M10 session |
| FA-m8 | All page/layout components | Missing explicit return type annotations | ✅ `ReactElement` return type added to AppLayout, AppRouter, HomePage, NotFoundPage, ComponentsDemoPage, ProtectedRoute, ThemeProvider, Header, Footer |
| FA-m9 | `src/pages/ComponentsDemoPage/ComponentsDemoPage.tsx` | Dead `import React from 'react'` | ✅ Removed; replaced with `import { useState, type ReactElement }` |
| FA-m10 | `src/hooks/useLocalStorage.ts` | No explicit return type on the exported hook | ✅ Return type `readonly [T, (next: SetStateAction<T>) => void, boolean]` added |
| FA-m11 | `src/utils/pwa.test.ts` | Six `as any` casts | ✅ Replaced with `BeforeInstallPromptEventLike`, `MockMessageChannel` interface, `as unknown as typeof MessageChannel` |
| FA-m12 | `src/utils/storage.test.ts` | `const a: any = {}` | ✅ Changed to `Record<string, unknown>` |
| FA-m13 | `src/test/setup.ts` | No `vi.clearAllMocks()` in `afterEach` | ✅ `vi.clearAllMocks()` added to global `afterEach` |
| FA-m14 | `src/test/setup.ts` | No global `console.warn`/`console.error` spy | ✅ `vi.spyOn(console, 'warn')` + `vi.spyOn(console, 'error')` added to global `beforeEach` |
| FA-m15 | `vite.config.ts` | `react-icons` not in its own `manualChunks` entry | ✅ `manualChunks` converted to function form; all `react-icons/*` sub-packages grouped into `icons` chunk |
| FA-m16 | `vite.config.ts` | `postcss-pxtorem` with `propList: ['*']` converts decorative px values | ✅ Changed to `['*', '!border*', '!box-shadow', '!outline*', '!column-rule*']` |
| FA-m17 | `package.json` | No `yarn audit` in the `check` script | ✅ `"audit": "yarn audit --level high"` script added; `check` prefixed with `yarn audit --level high &&` |
| FA-m18 | `package.json` | Yarn Classic (`1.22.22`) in long-term maintenance mode | ✅ `"packageManager": "yarn@1.22.22"` field added for Corepack awareness (migration to Yarn 4/pnpm deferred to team decision) |
| FA-m19 | (absent) | No `.editorconfig` | ✅ `.editorconfig` created: utf-8, LF, 2-space indent, final newline, trim trailing whitespace, Markdown exception |
| FA-m20 | `src/hooks/useDocumentTitle.ts` | `document.title` updates not announced by all AT/browser combos | ✅ Shared `aria-live="polite"` announcer element created on first use; `textContent` updated on every route change |

---

## Final Audit Summary

| Severity | Count | Status |
|---|---|---|
| **Critical** | 9 items | ✅ All completed |
| **Major** | 20 items | ✅ All completed |
| **Minor** | 20 items | ✅ All completed |

**All 49 findings resolved.** The codebase is production-ready as a template foundation.


