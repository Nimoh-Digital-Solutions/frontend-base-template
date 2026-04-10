# create-nimoh-app

Scaffold a production-ready full-stack project in one command: **Django backend** + **React/Vite frontend** + optional **Expo mobile app** — all pre-configured and wired together.

## Quick Start

```bash
npx @nimoh-digital-solutions/create-nimoh-app my-app
```

With mobile app:

```bash
npx @nimoh-digital-solutions/create-nimoh-app my-app --mobile
```

## What You Get

```
my-app/
  backend/            Django API (DRF + nimoh-be-django-base)
    .venv/            Python virtual environment (ready to use)
    config/           Django settings (base / development / production)
    docker-compose.yml
    Makefile
  frontend/           React app (Vite + TypeScript)
    Dockerfile        Multi-stage Docker build
    Makefile
  mobile/             Expo (React Native) app        ← with --mobile
  packages/
    shared/           Shared types, Zod schemas, i18n ← with --mobile
  .github/
    workflows/ci.yml  CI for BE + FE + mobile         ← with --mobile
    dependabot.yml    Auto dependency updates          ← with --mobile
  .gitignore
  Makefile            Root dev commands (start/stop all services)
  README.md
  .env.example
```

## Usage

```
npx @nimoh-digital-solutions/create-nimoh-app [project-name] [options]
```

### Options

| Flag | Description |
|------|-------------|
| `--yes`, `-y` | Non-interactive mode (accept all defaults) |
| `--mobile` | Include Expo (React Native) mobile app |
| `--ai-helpers` | Sync AI helper assets (agents, skills, instructions) |
| `--help`, `-h` | Show help |
| `--version`, `-V` | Show version |

### Examples

```bash
# Interactive (prompts for name, port offset, options)
npx @nimoh-digital-solutions/create-nimoh-app

# Named project
npx @nimoh-digital-solutions/create-nimoh-app my-saas

# Full stack with mobile, non-interactive
npx @nimoh-digital-solutions/create-nimoh-app my-saas --mobile --yes

# Custom port offset (BE 8100, FE dev 3100, FE prod 8180)
npx @nimoh-digital-solutions/create-nimoh-app my-saas  # then enter 100 at prompt

# With AI helpers
npx @nimoh-digital-solutions/create-nimoh-app my-saas --mobile --ai-helpers
```

## Prerequisites

- **Python** >= 3.12
- **Node.js** >= 18
- **Git**
- **Docker & Docker Compose** (for containerized workflows)
- **Expo CLI** (`npx expo`) — only if using `--mobile`

## What Gets Scaffolded

### Backend (Django)

- Django 5 + Django REST Framework
- [nimoh-be-django-base](https://pypi.org/project/nimoh-be-django-base/) with batteries included:
  - JWT authentication (Simple JWT with httpOnly cookies)
  - Celery + Celery Beat (async tasks)
  - Django Channels (WebSocket support)
  - PostgreSQL + Redis
  - Split settings (base / development / production / test)
  - WhiteNoise, Gunicorn + Uvicorn, SendGrid
- With `--mobile`: mobile auth (Google ID token), push notifications (Expo Push API), WebSocket JWT middleware

### Frontend (React)

- React 19 + TypeScript + Vite 7
- [@nimoh-digital-solutions/tast-*](https://www.npmjs.com/org/nimoh-digital-solutions) UI component packages
- TanStack Query v5, Zustand v5, React Router DOM v7
- React Hook Form + Zod validation
- i18next, Sentry, PWA support
- Vitest + Playwright + MSW testing
- Tailwind CSS v4
- Multi-stage Dockerfile with nginx

### Mobile (Expo) — `--mobile`

- Expo (React Native) with React Navigation
- TanStack Query + Zustand + MMKV storage
- Secure token storage (expo-secure-store)
- Biometric authentication
- Sentry error tracking
- Certificate pinning
- Offline mutation queue
- EAS Build configuration

### Shared Package — `--mobile`

- `packages/shared/` consumed by both frontend and mobile via `@shared/*` path aliases
- TypeScript types, Zod schemas, i18n JSON files, constants, and utilities
- Pre-configured in tsconfig, Vite, Babel, and Metro

## After Scaffolding

```bash
cd my-app

# Start everything
make start

# Or individually:
cd backend && source .venv/bin/activate && make dev
cd frontend && yarn dev
cd mobile && npx expo start    # if --mobile
```

## Port Defaults

| Service | Default Port |
|---------|-------------|
| Django API | 8000 |
| React dev (Vite) | 3000 |
| React prod (nginx) | 8080 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| Expo dev | 8081 |

Use the **port offset** to avoid conflicts when running multiple projects (e.g., offset 100 → Django 8100, React dev 3100).

## Related Packages

- [@nimoh-digital-solutions/create-tast-app](https://www.npmjs.com/package/@nimoh-digital-solutions/create-tast-app) — standalone frontend scaffolder
- [@nimoh-digital-solutions/create-tast-mobile-app](https://www.npmjs.com/package/@nimoh-digital-solutions/create-tast-mobile-app) — standalone mobile scaffolder
- [nimoh-be-django-base](https://pypi.org/project/nimoh-be-django-base/) — Django backend base package (PyPI)

## License

MIT
