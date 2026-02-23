---
'@nimoh-digital-solutions/create-tast-app': patch
---

fix(create-tast-app): configure Yarn 4 npmScopes for GitHub Packages registry

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
