# @nimoh-digital-solutions/create-tast-app

Interactive CLI that scaffolds a new TAST (Template for Application Starter Toolkit) project. Creates a production-ready React + TypeScript + Vite app with your brand colors, optional PWA, Docker, and Husky pre-configured.

[![npm](https://img.shields.io/npm/v/@nimoh-digital-solutions/create-tast-app)](https://www.npmjs.com/package/@nimoh-digital-solutions/create-tast-app)

## Quick start

```bash
npx @nimoh-digital-solutions/create-tast-app my-app
```

Or run without arguments for fully interactive mode:

```bash
npx @nimoh-digital-solutions/create-tast-app
```

## What you get

A complete React 19 starter with:

- **React 19** + **TypeScript** (strict mode)
- **Vite 7** with SWC for fast builds
- **SCSS Modules** + **Open Props** design tokens
- **Zustand** for state management
- **React Router v7** for routing
- **i18next** for internationalization
- **Vitest** + **React Testing Library** for testing
- **ESLint** + **Stylelint** + **Prettier** pre-configured
- Custom **brand colors** injected at scaffold time

### Optional features

| Feature | Description |
|---|---|
| **PWA** | Service worker, web manifest, offline support via `vite-plugin-pwa` |
| **Docker** | Multi-stage Dockerfile + docker-compose + nginx config |
| **Husky** | Git hooks with lint-staged + Commitlint (Conventional Commits) |

## Interactive prompts

When you run the CLI, you'll be asked:

| Prompt | Default | Description |
|---|---|---|
| App name | argument or `my-tast-app` | Used for `package.json` name and page title |
| Description | — | Short project description |
| Primary color | `#2563eb` | Main brand hex color |
| Secondary color | `#7c3aed` | Secondary brand hex color |
| Accent color | `#06b6d4` | Accent brand hex color |
| Enable PWA? | Yes | Adds service worker and manifest |
| Enable Docker? | Yes | Adds Dockerfile, docker-compose, nginx |
| Enable Husky? | Yes | Adds git hooks, lint-staged, commitlint |
| Package manager | Auto-detected | `yarn` / `npm` / `pnpm` |
| Install now? | Yes | Runs install after scaffolding |

## Usage examples

### Non-interactive (accepts defaults)

```bash
npx @nimoh-digital-solutions/create-tast-app my-dashboard
cd my-dashboard
yarn dev
```

### With specific package manager

```bash
# Scaffold, then install with pnpm
npx @nimoh-digital-solutions/create-tast-app my-app
cd my-app
pnpm install
pnpm dev
```

## What the CLI does

1. **Clones** the [TAST base template](https://github.com/Nimoh-Digital-Solutions/frontend-base-template) from GitHub
2. **Strips** monorepo artifacts (`packages/`, `.changeset/`, lockfiles)
3. **Replaces** tokens — app name, description, HTML title
4. **Injects** brand colors as SCSS variable overrides
5. **Removes** optional features you declined (Docker files, PWA config, Husky config)
6. **Converts** `workspace:^` dependencies to registry version ranges
7. **Runs** `corepack enable` + `yarn install` (or your chosen package manager)

## Post-scaffold commands

```bash
yarn dev          # Start dev server
yarn build        # Production build
yarn test         # Run Vitest in watch mode
yarn lint         # ESLint
yarn stylelint    # Stylelint (SCSS)
yarn format       # Prettier
yarn type-check   # TypeScript (no emit)
```

## Requirements

- **Node.js** >= 18
- **Git** (for cloning the template)

## Safety

The CLI will abort if it detects it's running inside an existing Yarn workspace to prevent accidental nested scaffolding.

## Development

This package lives in the [TAST monorepo](https://github.com/Nimoh-Digital-Solutions/frontend-base-template).

```bash
# Build the CLI
yarn packages:build

# Test locally
node packages/create-tast-app/dist/index.cjs my-test-app
```

## License

MIT
