---
"@nimoh-digital-solutions/create-nimoh-app": minor
"@nimoh-digital-solutions/create-tast-app": minor
---

feat: scaffolder improvements — non-interactive mode, workflow patching, expanded summary

- Add --yes/-y flag for non-interactive scaffolding (CI-friendly)
- Patch FE GitHub workflow files for standalone projects (ci.yml + release.yml)
- Clean monorepo-specific .gitignore entries and remove commitlint.config.js
- Generate root .env.example with shared APP_NAME variable
- Expand summary with all ports (PostgreSQL, Redis, prod) and root Makefile commands
- Generate root README.md with ports table and quick-start instructions
- Add patchReplace() utility with mismatch warnings for safer template patching
- Add graceful error handling to root git init
- Log warnings when hoistDirectory skips existing files
