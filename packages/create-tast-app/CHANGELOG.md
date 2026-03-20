# @nimoh-digital-solutions/create-tast-app

## 1.7.2

### Patch Changes

- 2688e2a: Fix APP_NAME whitespace in container names

  Wrap `APP_NAME` Makefile variable in `$(strip ...)` to prevent trailing whitespace from producing invalid Docker container names (e.g. `my_app   -fe-dev`). The scaffold now patches existing Makefiles with the same fix.

## 1.7.1

### Patch Changes

- cd8dcdf: Add `--port-offset <n>` CLI flag

  Allows callers (e.g. `create-nimoh-app`) to pre-set the port offset without interactive prompting. When provided, the port offset prompt is skipped and the value is used directly.

## 1.7.0

### Minor Changes

- eb7cab1: Add port offset and dynamic container naming for multi-project support
  - New `portOffset` prompt during scaffolding — shifts all host-facing ports so multiple projects can run simultaneously (0 = default; e.g. 100 → dev 3100, prod 8180, BE 8100)
  - Docker Compose container names now use `{appName}-fe-dev` / `{appName}-fe-prod` pattern (derived from package.json name via `${APP_NAME}`)
  - Scaffold patches docker-compose.yml, vite.config.ts, .env.example, .env.local, and Makefile with project-specific names and offset-adjusted ports
  - Template docker-compose.yml and Makefile updated to use dynamic `${APP_NAME}` instead of hardcoded `react-starter-kit-*`
  - setup-add-docker.js template also uses dynamic container names

## 1.6.0

### Minor Changes

- 5eb492c: Add animated split-panel auth layout with Framer Motion panel-swap animation.

  New auth components integrated into the scaffolded template:
  - `AuthSplitPanel` — full-viewport two-panel layout with `motion.div layout` spring animation that swaps the branding/form panels when switching between login and register
  - `AuthBranding` — animated branding panel with logo, headline, tagline, and social proof; content animates via `AnimatePresence` when mode changes
  - `AuthPage` — persistent single-component layout route for `/login` and `/register` that keeps `AuthSplitPanel` mounted across route transitions, enabling the panel-swap animation
  - `BackgroundPaths` — animated SVG path overlay on the dark panel
  - `ForgotPasswordForm` / `ForgotPasswordPage` — dedicated forgot-password screen with success state animation
  - `AuthRoutesWrapper` — layout route that redirects authenticated users to home
  - Design tokens in `_auth-tokens.scss` for consistent auth-screen theming

  Accessibility: `<main>` landmark, `<h1>` heading on every auth page, reduced-motion support throughout.

## 1.5.2

### Patch Changes

- Change Tailwind CSS default from No to Yes

  The interactive prompt, the `--yes` non-interactive path, and the `??` fallback all now default `enableTailwind` to `true`. Press Enter to accept Tailwind; explicitly choose No to skip it.

## 1.5.1

### Patch Changes

- Fix three production Docker build blockers identified during BE↔FE integration
  - **Fix Docker build fail in scaffolded projects** — the Dockerfile contained `COPY packages/ packages/` which only applies to this monorepo. Scaffolded standalone projects don't have a `packages/` directory, causing the production image build to fail immediately. `scaffold.ts` now strips that line (and updates the surrounding comment) when Docker is kept in a scaffolded project.
  - **Fix `read_only: true` + envsubst conflict** — `app-prod` in `docker-compose.yml` had `read_only: true` but nginx-unprivileged's entrypoint writes envsubst-processed config files to `/etc/nginx/conf.d/` at startup, which fails on a read-only filesystem. Added `/etc/nginx/conf.d` and `/tmp` to the `tmpfs` list so envsubst can write while the rest of the filesystem stays immutable.
  - **Fix HSTS localhost cache poisoning** — `security_headers.conf` sent `Strict-Transport-Security` on all responses including `localhost:8080`. This poisons the browser's HSTS cache and forces all subsequent localhost traffic to HTTPS, breaking local development. Added a `map $host $hsts_header` directive in `nginx.conf` that returns an empty string for `localhost` (suppressing the header) and the full HSTS value for production hosts.

## 1.5.0

### Minor Changes

- Pre-wire backend integration in scaffolded projects

  **Bug fixes**
  - Fix `VITE_WS_URL` Zod validator — `z.string().url()` rejected `ws://` and `wss://` schemes, causing a startup crash whenever a WebSocket URL was configured. Replaced with a `.refine()` regex check.
  - Fix `APP_CONFIG.wsUrl` — the documented auto-derivation from `VITE_API_URL` (http→ws, https→wss) was not implemented. Added `deriveWsUrl()` so only one env var is required.

  **New features**
  - Add Vite dev-server proxy for `/api` and `/ws` — eliminates CORS entirely during `yarn dev` when `VITE_API_URL` is set. No backend CORS config needed in development.
  - Activate nginx reverse-proxy blocks for `/api/` and `/ws/` (previously commented out) and parameterise the backend URL via `${BACKEND_URL}` envsubst so it is runtime-configurable without rebuilding the image.
  - Add `BACKEND_URL` to Dockerfile and `NGINX_ENVSUBST_FILTER` so the default (`http://backend:8000`) can be overridden at container start-up.
  - Update `docker-compose.yml` with a `BACKEND_URL` env var on `app-prod` and a `nimoh_base`-aligned backend service template (Redis, Celery-ready, correct env vars).
  - Pre-fill `.env.example` with `VITE_API_URL=http://localhost:8000` so scaffolded projects work out of the box against a local backend.
  - Add `make be-health` (smoke-test the backend health endpoint) and `make docker-stack` (start the full prod stack in one command) to the Makefile.

## 1.4.0

### Minor Changes

- feat: rollback on failure + test coverage
  - **Rollback on failure** — if scaffold crashes mid-way, the partially-created directory is automatically cleaned up
  - **Test coverage** — 50 tests across 3 suites: unit tests for utils & spinner, integration tests for scaffold (token replacement, feature removal, .env.local, tsconfig cleanup, Docker/Husky removal, rollback, package.json snapshot)

## 1.3.0

### Minor Changes

- feat: spinner progress indicator and .env.local generation
  - **Spinner** — animated Braille-dot spinner during `git clone` and dependency install (zero-dependency, event-loop friendly via new `execAsync` helper)
  - **`.env.local` generation** — automatically copies `.env.example` → `.env.local` with `VITE_APP_TITLE` pre-filled with the app name

## 1.2.0

### Minor Changes

- feat: implement high-value features 5-9
  - **git init + initial commit** — scaffolded projects now start with a clean git repo and initial commit
  - **`--yes` / `-y` flag** — non-interactive mode that accepts all defaults, useful for CI/scripting
  - **Remove `nginx/` directory** — `removeDocker()` now also cleans up the `nginx/` dir and `Makefile`
  - **`engines` field** — declares `"node": ">=18"` in package.json
  - **Git availability check** — friendly error with install link if `git` is not on PATH

## 1.1.16

### Patch Changes

- 66f32de: CI: auto-update lockfile after changesets version bump

## 1.1.15

### Patch Changes

- 0f46762: Republish packages with MIT LICENSE files included

## 1.1.14

### Patch Changes

- 39fa9d2: Add MIT LICENSE files and license field to all packages

## 1.1.13

### Patch Changes

- d7e3f4d: docs: add comprehensive README documentation for all packages

## 1.1.12

### Patch Changes

- 84f2b91: fix(install): run `corepack enable` before `yarn install`

  On machines where Corepack has never been activated, the global Yarn is still
  1.x which fails with "current global version of Yarn is 1.22.22". Running
  `corepack enable` silently before the install step activates Yarn 4 via the
  `packageManager` field in package.json, so the scaffold works out of the box
  on fresh machines.

## 1.1.11

### Patch Changes

- 0d42f0f: fix: resolve workspace: protocol in published dependencies
  - tast-ui: change `@nimoh-digital-solutions/tast-utils` from `workspace:^` to `^1.1.0` in runtime `dependencies` — fixes `YN0001: workspace:^` error for any project installing tast-ui
  - tast-hooks: same fix for `@nimoh-digital-solutions/tast-utils`
  - create-tast-app: banner now shows the actual published version instead of hardcoded v1.0.0
  - All packages: add `"tag": "latest"` to publishConfig so the `@latest` dist-tag is always updated on publish

## 1.1.10

### Patch Changes

- 4ea1408: fix(scaffold): use workspaces:[] to stop Yarn traversing into parent monorepo

  Yarn 4 finds a workspace root by walking UP the directory tree. When the
  scaffolded app is created inside a monorepo (e.g. the user forgot to `cd` out
  of `tast-fe-app` first), Yarn found the monorepo root, then resolved
  `@nimoh-digital-solutions/*` from the local `packages/` tree, which contains
  `workspace:^` cross-references that don't exist outside the monorepo:

  ```
  YN0001: @nimoh-digital-solutions/tast-utils@workspace:^: Workspace not found
  ```

  This happened even after `yarn.lock` and `packages/` were deleted from the
  scaffolded app, because Yarn walked up and used the PARENT workspace's
  `yarn.lock` at `tast-fe-app/yarn.lock`.

  **Fix:** Set `"workspaces": []` in the scaffolded `package.json` instead of
  deleting the field. Yarn treats any `package.json` with a `workspaces` field
  as a workspace root. An EMPTY array means "I am a root with no packages" —
  Yarn stops traversal here and installs all deps from the registry.

  Also:
  - Strip any `workspace:` protocol from deps (defensive, in case any slip in)
  - Remove `storybook` / `storybook:build` scripts (reference tast-ui workspace)

## 1.1.8

### Patch Changes

- 9869bef: feat(install): auto-read GitHub Packages token from ~/.npmrc

  Previously `yarn install` during scaffolding required `NPM_TOKEN` to be
  exported in the shell, even if the user had the token in `~/.npmrc`. The
  scaffolder would bail immediately with a "token not set" error.

  `resolveNpmToken()` now resolves the token with this priority:
  1. `NPM_TOKEN` environment variable (CI, Docker, explicit export)
  2. `//npm.pkg.github.com/:_authToken=<value>` line in `~/.npmrc`

  The resolved token is injected as `NPM_TOKEN` into the `yarn install`
  subprocess env so Yarn 4's `.yarnrc.yml` `${NPM_TOKEN:-}` interpolation
  picks it up — without the user ever having to `export NPM_TOKEN`.

  The bail-early path now only triggers when the token cannot be found from
  either source (no env var and no matching `~/.npmrc` line).

## 1.1.7

### Patch Changes

- 3d2da6f: fix(scaffold): abort instead of warn when run inside a Yarn workspace

  The previous `warnIfInsideWorkspace` printed a warning but continued scaffolding.
  When `my-app` is created inside a monorepo (e.g. the user ran `npx create-tast-app`
  from inside `tast-fe-app`), Yarn walks up the directory tree, finds the workspace
  root, and resolves `@nimoh-digital-solutions/*` packages from the local `packages/`
  tree instead of the registry. Those packages use `workspace:^` to reference each
  other, causing `yarn install` to fail with:

  ```
  YN0001: Error: @nimoh-digital-solutions/tast-utils@workspace:^: Workspace not found
  ```

  This happens even after manually deleting `yarn.lock` and `packages/` from the
  scaffolded app, because Yarn re-discovers the parent workspace on every run.

  **Fix:** `abortIfInsideWorkspace()` — exits with code 1 and prints a clear error
  message telling the user to run the command from outside the monorepo, with an
  exact example command they can copy-paste.

- 30cf997: fix(scaffold): delete yarn.lock and packages/ from cloned template

  The monorepo `yarn.lock` resolves `@nimoh-digital-solutions/*` packages via
  the `workspace:` protocol (e.g. `workspace:^`). Outside the monorepo those
  workspace references do not exist, causing `yarn install` to fail immediately:

  ```
  YN0001: Error: @nimoh-digital-solutions/tast-utils@workspace:^: Workspace not found
  ```

  Also removes:
  - `packages/` — internal monorepo packages (tast-ui, tast-utils, etc.) that
    have no purpose in a standalone scaffolded app
  - `.changeset/` — changeset config and pending changesets belong in the monorepo

  These are now deleted in `scaffold.ts` immediately after `.git` removal, so the
  fresh `yarn install` generates a proper lockfile from the npm / GitHub Packages
  registry.

- e688de0: fix(create-tast-app): bail early + show token setup steps when NPM_TOKEN is absent

  Previously the scaffolder warned about the missing token but still attempted
  `yarn install`, which failed with a confusing `YN0041: Invalid authentication
(as an anonymous user)` error from Yarn.

  Changes:
  - `install.ts` — when using Yarn and `NPM_TOKEN` is not set, bail immediately
    (return false) instead of warning-then-failing with a 401
  - `index.ts/printNextSteps` — when the install was skipped, inject a clear
    token-setup step (`export NPM_TOKEN=...` + link to github.com/settings/tokens)
    before the `yarn install` line in the next steps output
  - `index.ts/main` — exit(0) instead of exit(1) when the scaffold completed
    successfully and only the install step was skipped, so the calling shell
    does not treat a ready project as an error

## 1.1.3

### Patch Changes

- 910219d: fix(create-tast-app): configure Yarn 4 npmScopes for GitHub Packages registry

  Yarn 4 does not honour `.npmrc` `@scope:registry=` entries — scope-to-registry
  routing must be declared in `.yarnrc.yml` under `npmScopes`. The Phase 8 Yarn 4
  migration added `nodeLinker: node-modules` but omitted this config, causing
  `yarn install` in scaffolded projects to hit `registry.yarnpkg.com` instead of
  `npm.pkg.github.com` and fail with 404 on `@nimoh-digital-solutions/*` packages.

  Changes:
  - `.yarnrc.yml` — add `npmScopes.nimoh-digital-solutions` pointing to GitHub
    Packages with `${NPM_TOKEN}` interpolation
  - `.npmrc` — update comment to clarify Yarn 4 reads `.yarnrc.yml` for this
  - `packages/create-tast-app/src/install.ts` — warn user when `NPM_TOKEN` is
    not set before running `yarn install`, so auth failures are actionable

## 1.1.1

### Patch Changes

- 32514ec: fix: update injectBrandColors to target new CSS custom property theme system

  Brand colour prompts now set `--brand-hue`, `--brand-saturation`,
  `--brand-lightness` on `html` (driving the whole light+dark palette)
  instead of the old `--color-primary*` mixin tokens. Secondary sets
  `--brand-secondary`, tertiary sets `--brand-accent`/`--accent-hue`.

## 1.1.0

### Minor Changes

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
