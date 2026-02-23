---
"@nimoh-digital-solutions/create-tast-app": patch
"@nimoh-digital-solutions/tast-ui": patch
---

fix(tast-ui): correct CSS export path to point at dist/index.css (actual Vite lib output)

fix(create-tast-app): strip workspaces, changeset scripts, and monorepo-only devDeps from scaffolded app package.json to prevent Yarn from treating new projects as workspace roots
