# @nimoh-digital-solutions/create-tast-app

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
