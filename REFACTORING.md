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

**All refactoring work complete.** The template is production-ready.


