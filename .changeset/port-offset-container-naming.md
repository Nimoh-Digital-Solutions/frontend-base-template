---
"@nimoh-digital-solutions/create-tast-app": minor
---

Add port offset and dynamic container naming for multi-project support

- New `portOffset` prompt during scaffolding — shifts all host-facing ports so multiple projects can run simultaneously (0 = default; e.g. 100 → dev 3100, prod 8180, BE 8100)
- Docker Compose container names now use `{appName}-fe-dev` / `{appName}-fe-prod` pattern (derived from package.json name via `${APP_NAME}`)
- Scaffold patches docker-compose.yml, vite.config.ts, .env.example, .env.local, and Makefile with project-specific names and offset-adjusted ports
- Template docker-compose.yml and Makefile updated to use dynamic `${APP_NAME}` instead of hardcoded `react-starter-kit-*`
- setup-add-docker.js template also uses dynamic container names
