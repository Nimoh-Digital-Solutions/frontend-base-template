---
'@nimoh-digital-solutions/create-tast-app': patch
---

feat(install): auto-read GitHub Packages token from ~/.npmrc

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
