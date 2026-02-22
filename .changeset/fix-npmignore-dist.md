---
"@nimoh-digital-solutions/tast-ui": patch
"@nimoh-digital-solutions/tast-hooks": patch
"@nimoh-digital-solutions/tast-utils": patch
"@nimoh-digital-solutions/create-tast-app": patch
---

fix: add .npmignore to ensure dist/ is included in published packages

Previously the root .gitignore excluded dist/ and with no package-level
.npmignore, npm was falling back to .gitignore rules and omitting the built
output from the tarball. Adding .npmignore to each publishable package causes
npm to use it instead of .gitignore, so dist/ is correctly included.
