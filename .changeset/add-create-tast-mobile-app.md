---
"@nimoh-digital-solutions/create-tast-mobile-app": minor
---

New package: CLI to scaffold an Expo (React Native) mobile app from the react-native-base-template

- `npx @nimoh-digital-solutions/create-tast-mobile-app <name>` clones the template, strips bundled shared/, adjusts @shared/* paths for monorepo layout, replaces tokens, and cleans up artifacts
- Supports `--yes` (non-interactive), `--no-git`, `--no-install`, `--port-offset`, `--bundle-id` flags
- Designed for standalone use or as the mobile scaffolder called by `create-nimoh-app --mobile`
