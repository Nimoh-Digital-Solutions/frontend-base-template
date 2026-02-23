# TAST Frontend Template — Package Review

> Review date: February 23, 2026  
> Template version: 1.0.0 (TEMPLATE_VERSION)  
> All published packages: `create-tast-app@1.1.1`, `tast-utils@1.1.0`, `tast-ui@1.1.0`,  
> `tast-hooks@1.0.1`, `tast-styles@1.1.0`, `eslint-config@1.0.0`, `stylelint-config@1.0.0`, `tsconfig@1.0.0`

---

## Part 1 — Strengths

### Architecture & Developer Experience

**1. Monorepo with published packages**  
The template itself is the source of truth for 8 npm packages. Every scaffolded app gets battle-tested utilities, components, and config from a published registry — not vendored copies that rot over time. The separation of `src/` (app shell) from `packages/` (framework) is clean and well understood.

**2. `create-tast-app` CLI**  
`npx @nimoh-digital-solutions/create-tast-app` scaffolds a full app with prompts for project name, package manager, brand colours, and optional feature flags. Brand colours inject direct into `_brand.scss` so the CSS custom property palette is customised at scaffold time, not after.

**3. Feature-sliced directory with documentation**  
`src/features/` ships with a README that explains the module anatomy, import rules, cross-feature boundaries, and a barrel pattern example. Developers know exactly where new feature code lives from day one.

**4. Route-level code splitting everywhere**  
All pages are `React.lazy()` wrapped with `Suspense` in `routesConfig.tsx`. No page chunk is loaded until the user navigates to it. Even the `PageFallback` is in its own scoped SCSS module.

**5. Comprehensive SCSS token system**  
`_variables.scss` → `_functions.scss` → `_mixins.scss` is a disciplined design token pipeline. `func.color()`, `func.spacing()`, `func.font-size()`, `func.border-radius()` all read from typed maps. Consumers never touch raw values directly.

---

### Theme System

**6. Full CSS custom property theme — light, dim, and dark**  
`_base.scss` defines a single-source-of-truth palette using `--brand-hue / --brand-saturation / --brand-lightness` as foundations, then derives all `--surface-*`, `--text-*`, `--border-*`, and shadow tokens for all three modes. Adding a new theme stop is one new `[data-theme='…']` block.

**7. OS preference fallback**  
`@media (prefers-color-scheme: dark)` is handled with `:where(html:not([data-theme]))` so the OS dark preference is respected out-of-the-box without any JavaScript.

**8. 3-way toggle with persistence**  
`toggleTheme` cycles `light → dim → dark → light`. Theme is persisted in `localStorage` via the storage utility with a sensitive-key guard. The `ThemeProvider` reads the stored value on mount and validates it against the known `Theme` union type before applying it.

---

### Testing

**9. Testing infrastructure built in, opt-out available**  
Vitest + Testing Library is configured and working with JSDOM. The test suite covers `ThemeContext`, `useTheme`, `useLocalStorage`, `useDocumentTitle`, `ErrorBoundary`, `ProtectedRoute`, `Button`, all `utils/*` modules, and the HTTP client (11 + 182 tests). Coverage report via `yarn test:coverage`.

**10. Tests match implementation contract**  
Tests are structured around behaviour, not implementation. The `ThemeContext` tests use a real React render + `userEvent`, not `act()` stubs. The toggle tests now correctly model the 3-way cycle.

---

### Tooling & CI

**11. GitHub Actions CI pipeline**  
`ci.yml` runs on every push/PR to `main`: packages build → type-check → ESLint → Stylelint → Vitest. No merge without green CI.

**12. Automated release pipeline with Changesets**  
`release.yml` watches for changeset files and opens a versioning PR automatically. `yarn changeset:publish` builds all packages and publishes to GitHub Packages in one step. Semantic versioning is enforced by the changeset kind (`patch | minor | major`).

**13. Commit quality enforced at the hook level**  
Husky + commitlint enforce Conventional Commits on every `git commit`. The `prepare` script installs hooks automatically on `yarn install`. Husky setup is opt-out via `yarn setup`.

**14. Docker — dev + production, security hardened**  
- Dev: Node 22 Alpine, NPM_TOKEN forwarded without baking into the image layer, `user: node` removed to avoid volume permission issues.  
- Production: `nginx-unprivileged` (non-root), HSTS header, `.dockerignore` prevents `.env` from entering the image, listens on port 8080.

**15. Bundle analysis mode**  
`yarn build:analyze` produces `dist/stats.html` via `rollup-plugin-visualizer`. Gzip + Brotli sizes visible at a glance.

**16. PostCSS pipeline**  
`postcss-jit-props` strips unused Open Props vars from output. `postcss-pxtorem` converts `px` → `rem`. `autoprefixer` handles vendor prefixes. Zero PostCSS config sprawl — all in `vite.config.ts`.

---

### Security

**17. Sensitive key guard in `storage.ts`**  
`setStorageItem` refuses to store values whose key matches `/token/i`, `/secret/i`, `/password/i`, `/auth/i`. A console warning is emitted. Demonstrated by passing `storage.test.ts` spec.

**18. CSRF comment in `http.ts`**  
A documented note in the HTTP service calls out where CSRF token headers should be added once session-cookie authentication is wired in. It won't be missed during integration.

---

---

## Part 2 — Improvement Areas

### Priority 1 — Correctness / Will Cause Issues

---

#### I1. Root `package.json` still pins `tast-ui` and `tast-utils` at `^1.0.0`

The packages are at `1.1.0` (`dim` theme type + 3-way toggle). The `^` range will resolve to `1.1.0` on the next clean install, but the `package.json` manifest is misleading — it implies the minimum compatible version is `1.0.0` when `dim` theme features require `≥ 1.1.0`.

**Fix:** Bump the pinned ranges in `package.json`:
```json
"@nimoh-digital-solutions/tast-ui": "^1.1.0",
"@nimoh-digital-solutions/tast-utils": "^1.1.0"
```

---

#### I2. `TEMPLATE_VERSION` file not bumped

`TEMPLATE_VERSION` still reads `1.0.0`. It should reflect the current template version to give scaffolded apps a reference point for how far behind they are versus the template source.

**Fix:** Update `TEMPLATE_VERSION` to `1.1.0` and keep it in sync with each significant template change.

---

#### I3. No coverage thresholds enforced in CI

`vitest run --coverage` produces a report but no `coverage.thresholds` is set in `vite.config.ts`. CI will pass at 0% coverage if all tests are deleted. The safety net is not actually enforced.

**Fix:** Add to `vite.config.ts` vitest config:
```typescript
coverage: {
  thresholds: {
    lines: 70,
    functions: 70,
    branches: 60,
    statements: 70,
  }
}
```

---

### Priority 2 — Developer Onboarding

---

#### I4. `src/features/` is empty — no example feature

The `features/README.md` explains the pattern well, but there is no working example. Developers scaffold the app and see a directory with only a README. The pattern remains abstract until they build their first feature.

**Fix:** Add a minimal `auth/` or `counter/` feature with:
- `components/LoginForm/` — a simple form component
- `hooks/useAuth.ts` — stub hook returning `{ isAuthenticated: false }`
- `services/auth.service.ts` — one POST call using `http`
- `types/auth.types.ts` — `User` and `LoginPayload` interfaces
- `index.ts` barrel

Remove it via `yarn setup` in the same way PWA/testing are removed.

---

#### I5. `tast-hooks` is very thin

Only 2 hooks (`useLocalStorage`, `useDocumentTitle`). Projects reach for the same small set of hooks repeatedly.

**Suggested additions to `tast-hooks`:**

| Hook | Purpose |
|---|---|
| `useDebounce<T>(value, delay)` | Debounce a value — search/filter inputs |
| `useMediaQuery(query)` | `boolean` — e.g. `'(max-width: 768px)'` |
| `useClickOutside(ref, handler)` | Close dropdowns/modals when clicking outside |
| `useWindowSize()` | `{ width, height }` — responsive logic in JS |
| `usePrevious<T>(value)` | Previous render value — useful for transitions |
| `useToggle(initial?)` | `[value, toggle, setTrue, setFalse]` — eliminates boilerplate |

These 6 hooks are used in ~90% of real apps. Shipping them in `tast-hooks` means every scaffolded project gets them for free.

---

#### I6. No state management guidance or example

The template has `ThemeContext` as the only context/store. There is no guidance on how to manage app-level state beyond a single feature. Developers are left to decide between Zustand / Jotai / Redux Toolkit / plain context with `useReducer` with no scaffolded starting point.

**Fix:** Add a minimal Zustand or Jotai store example (one counter or notification store) to `src/data/` or `src/features/`. Add a brief `STATE_MANAGEMENT.md` guidance doc with the chosen approach and why.

---

#### I7. No form handling boilerplate

Forms are the most common UI pattern in apps. There is no React Hook Form or Zod set up, no example form component, and no guidance in the README.

**Fix (minimal):** Add `react-hook-form` and `zod` to the template's `package.json`. Add a `src/components/ui/Form/` directory with a thin typed `<Field />` wrapper and a `LoginForm` example in the `auth` feature (see I4).

---

#### I8. Environment variable validation — no build-time safety

`APP_CONFIG` reads `import.meta.env.VITE_API_URL` with no validation. If `VITE_API_URL` is missing in a deployment, `createHttpClient(undefined)` will silently produce broken API calls at runtime, not a build error.

**Fix:** Add a Zod env schema (or manual validation) that throws at app startup if required vars are missing:
```typescript
// src/configs/env.ts
import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.string().url({ message: 'VITE_API_URL must be a valid URL' }),
  VITE_APP_TITLE: z.string().optional(),
});

export const env = envSchema.parse(import.meta.env);
```
`APP_CONFIG` reads from `env` instead of `import.meta.env` directly.

---

### Priority 3 — UI Component Coverage

---

#### I9. `tast-ui` ships only one component

`Button` is the only component in the published `tast-ui` package. Virtually every project needs a small set of primitives before it can build screens.

**Suggested next components for `tast-ui`:**

| Component | Notes |
|---|---|
| `Input` / `Textarea` | Supports label, error state, helper text |
| `Badge` | Status indicator — success/warning/error/neutral variants |
| `Spinner` / `Loader` | Generic loading state |
| `Card` | Surface-2 container with configurable padding/shadow |
| `Modal` / `Dialog` | Built on the native `<dialog>` element — focus trap, Esc to close |
| `Toast` / `Notification` | Stacked dismissible banners — plugs into ErrorBoundary pattern |

Each component should follow the existing `Button` pattern: typed interface, SCSS module using CSS vars, test file, exported from `tast-ui`.

---

#### I10. No Storybook for `tast-ui`

The `ComponentsDemoPage` is a good in-app showcase but all components must be viewed running the full dev server. There is no isolated component development story.

**Fix:** Add Storybook to the `packages/tast-ui/` workspace. Stories for each component give collaborators a visual contract and make regression testing cheap.

---

### Priority 4 — DX Niceties

---

#### I11. Yarn v1 — time to plan a migration

The monorepo runs Yarn v1 (`1.22.22`). Yarn v1 is unmaintained. Key gaps:
- No `workspace:^` protocol (forces full semver in all cross-package deps)
- No Yarn PnP (faster installs, zero phantom deps)
- Security audit (`yarn audit`) can't autofix — `yarn audit --fix` does not exist
- Patch-package support requires workarounds

**Suggested path:** Migrate to Yarn v4 Berry (stable, officially the continuation). It supports Yarn classic lockfiles for migration and is backward-compatible with `workspaces` config.

---

#### I12. Setup scripts are opt-out only — no opt-in

`yarn setup` lets you remove PWA, testing, Husky, or Docker. But if you keep Docker during scaffold and later want to remove it, or if you remove testing and want it back, there is no add path.

**Fix:** Mirror each `setup:remove-*` with a `setup:add-*` variant, or extend the `setup.js` TUI to ask "Add or Remove?" at the top level.

---

#### I13. `dim` theme has no OS preference entry point

Light and dark modes have `@media (prefers-color-scheme: …)` mapping. The `dim` theme is only accessible via the toggle — a user who wants dim by default cannot express that preference through OS settings.

**Potential fix:** Expose a "preferred theme" localStorage key (separate from the "active theme") in the setup flow, or add a theme preference UI beyond the icon button in the Header.

---

#### I14. No accessibility (a11y) runtime testing

ESLint with `eslint-plugin-jsx-a11y` catches static issues. But focus management, ARIA live regions, modal focus traps, and colour contrast are runtime behaviours that static analysis misses.

**Fix:** Add `@axe-core/react` in development mode and `@testing-library/jest-axe` in tests. An axe scan on mount will surface WCAG violations during development without any extra effort.

---

#### I15. No internationalization stub

There is no `src/i18n/` directory, no `i18next` or similar setup, and no guidance in the README. Teams that need i18n have no starting point and end up retrofitting it after hardcoding strings everywhere.

**Fix (minimal):** Add `src/i18n/` with a basic `i18next` + `react-i18next` setup, one `en.json` locale file, and a note in README that other locales go here. Keep it opt-out in `yarn setup`.

---

---

## Summary Table

| # | Area | Priority | Effort |
|---|---|---|---|
| I1 | Pin `tast-ui`/`tast-utils` at `^1.1.0` in root `package.json` | 🔴 High | Trivial |
| I2 | Bump `TEMPLATE_VERSION` to `1.1.0` | 🔴 High | Trivial |
| I3 | Add coverage thresholds to `vite.config.ts` | 🔴 High | Small |
| I4 | Add example feature to `src/features/` | 🟠 Medium | Medium |
| I5 | Add 6 common hooks to `tast-hooks` | 🟠 Medium | Medium |
| I6 | Add state management guidance + example | 🟠 Medium | Medium |
| I7 | Add `react-hook-form` + `zod` form boilerplate | 🟠 Medium | Medium |
| I8 | Add env var Zod validation in `APP_CONFIG` | 🔴 High | Small |
| I9 | Add `Input`, `Badge`, `Spinner`, `Card`, `Modal` to `tast-ui` | 🟠 Medium | Large |
| I10 | Add Storybook to `packages/tast-ui/` | 🟡 Low | Medium |
| I11 | Migrate Yarn v1 → Yarn v4 Berry | 🟡 Low | Large |
| I12 | Add opt-in path to setup scripts | 🟡 Low | Medium |
| I13 | OS preference path for `dim` theme | 🟡 Low | Small |
| I14 | Add `jest-axe` + `@axe-core/react` for a11y testing | 🟠 Medium | Small |
| I15 | Add `i18n` stub (opt-out) | 🟡 Low | Medium |

---

*Generated from live codebase analysis — February 23, 2026*
