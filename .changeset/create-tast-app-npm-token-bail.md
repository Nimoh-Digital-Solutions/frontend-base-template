---
'@nimoh-digital-solutions/create-tast-app': patch
---

fix(create-tast-app): bail early + show token setup steps when NPM_TOKEN is absent

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
