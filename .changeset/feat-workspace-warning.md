---
"@nimoh-digital-solutions/create-tast-app": patch
---

feat: warn when CLI is run inside a Yarn workspace

Detects if the current working directory is inside a Yarn workspace root
(by traversing parent directories for a package.json with a workspaces field).
If found, prints a clear warning that the new app should be created outside
the monorepo or else Yarn will resolve scoped packages to workspace symlinks
(which have no dist/) instead of the published registry packages.
