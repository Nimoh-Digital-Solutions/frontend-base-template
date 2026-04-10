# @nimoh-digital-solutions/create-nimoh-app

## 1.4.0

### Minor Changes

- a49460d: Add `--mobile` flag to scaffold a full-stack project with Expo mobile app
  - New `--mobile` flag (and interactive prompt) to include an Expo (React Native) mobile app
  - Scaffolds `packages/shared/` with TypeScript types, Zod schemas, i18n, constants, and utils
  - Invokes `create-tast-mobile-app` to clone and configure the mobile template
  - Patches FE Dockerfile to include shared package in Docker builds
  - Passes `use_mobile`, `use_push`, `mobile_app_scheme` to backend scaffolding
  - Generates `.github/workflows/ci.yml` and `.github/dependabot.yml` when mobile is active
  - Mobile sections added to root `.gitignore`, `Makefile`, `README.md`, `.env.example`
  - Added `--help` and `--version` flags

## 1.3.0

### Minor Changes

- 00d64da: Add `--ai-helpers` flag to scaffold AI helper assets alongside the full-stack project
  - Opt-in via `--ai-helpers` flag or interactive prompt
  - Syncs agents, skills, instructions, prompts, and workflows into `.github` and `.claude`
  - Non-fatal: prints manual sync command if the download fails

## 1.2.0

### Minor Changes

- 8e48d1d: feat: scaffolder improvements — non-interactive mode, workflow patching, expanded summary
  - Add --yes/-y flag for non-interactive scaffolding (CI-friendly)
  - Patch FE GitHub workflow files for standalone projects (ci.yml + release.yml)
  - Clean monorepo-specific .gitignore entries and remove commitlint.config.js
  - Generate root .env.example with shared APP_NAME variable
  - Expand summary with all ports (PostgreSQL, Redis, prod) and root Makefile commands
  - Generate root README.md with ports table and quick-start instructions
  - Add patchReplace() utility with mismatch warnings for safer template patching
  - Add graceful error handling to root git init
  - Log warnings when hoistDirectory skips existing files

### Patch Changes

- e5a4651: fix: pass offset-aware frontend_url to backend CLI config so CORS_ALLOWED_ORIGINS and FRONTEND_URL match the actual FE dev port when a port offset is used

## 1.1.2

### Patch Changes

- cdadb86: fix: preserve Django app directory when hoisting backend files (name collision with project slug)

## 1.1.1

### Patch Changes

- 8bfcdac: fix: hoist backend project files to backend/ instead of nesting under backend/<slug>/

## 1.1.0

### Minor Changes

- cd8dcdf: New package: full-stack project scaffolder (Django BE + React FE)
  - `npx @nimoh-digital-solutions/create-nimoh-app` scaffolds a complete project with `backend/` and `frontend/` directories
  - Checks prerequisites (Python ≥3.12, Node ≥18, git)
  - Asks shared values (project name, port offset) once, passes them to both sub-CLIs
  - Creates `.venv` inside `backend/`, installs `nimoh-be-django-base[cli]`, runs `nimoh-base init` interactively
  - Runs `create-tast-app` interactively for the frontend
  - Initialises a single git repo at the project root
