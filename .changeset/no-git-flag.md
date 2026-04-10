---
"@nimoh-digital-solutions/create-tast-app": patch
"@nimoh-digital-solutions/create-nimoh-app": patch
---

Add --no-git flag to create-tast-app and pass it from create-nimoh-app so sub-scaffolders don't create .git directories — git init only happens at the monorepo root
