---
"@nimoh-digital-solutions/create-nimoh-app": minor
---

Add `--mobile` flag to scaffold a full-stack project with Expo mobile app

- New `--mobile` flag (and interactive prompt) to include an Expo (React Native) mobile app
- Scaffolds `packages/shared/` with TypeScript types, Zod schemas, i18n, constants, and utils
- Invokes `create-tast-mobile-app` to clone and configure the mobile template
- Patches FE Dockerfile to include shared package in Docker builds
- Passes `use_mobile`, `use_push`, `mobile_app_scheme` to backend scaffolding
- Generates `.github/workflows/ci.yml` and `.github/dependabot.yml` when mobile is active
- Mobile sections added to root `.gitignore`, `Makefile`, `README.md`, `.env.example`
- Added `--help` and `--version` flags
