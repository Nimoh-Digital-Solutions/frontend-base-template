# @nimoh-digital-solutions/create-tast-app

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
