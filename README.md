# ReactStarterKit

A modern React starter kit with TypeScript, Vite, SCSS, and comprehensive tooling for building scalable applications.

## 🚀 Features

- **React 19** with TypeScript
- **Vite** for fast development and building
- **SCSS** with clean architecture pattern
- **ESLint** + **Prettier** + **Stylelint** for code quality
- **Conventional Commits** enforced via commitlint
- **React Router** for client-side routing
- **Path aliases** for clean imports
- **PostCSS** with autoprefixer and px-to-rem conversion
- **SVG support** with vite-plugin-svgr
- **Git Hooks** (optional) with Husky for automated quality checks
- **Docker** (optional) support for development and production
- **PWA Support** (optional) with offline functionality and install prompts
- **Testing Infrastructure** (optional) with Vitest and React Testing Library

<!-- OPTIONAL:SETUP:START -->

## 🎯 Initial Setup

After cloning this repository, run the setup script to configure optional features:

```bash
yarn setup
```

This interactive script will ask you about:

- **PWA Support** – Progressive Web App features
- **Testing Infrastructure** – Vitest and React Testing Library
- **Git Hooks (Husky)** – Pre-commit, commit-msg, and pre-push hooks
- **Docker** – Development and production containerization

Choose which features you want to keep. The setup script will remove unwanted features.

### Setup scripts and cleanup behavior

- `yarn setup` is the main entrypoint.
- Individual feature cleanup scripts self-destruct after use.
- Once all optional features are removed, `setup.js` removes itself.

<!-- OPTIONAL:SETUP:END -->

## 📦 Installation

```bash
yarn install
```

## 🔧 Environment Variables

Copy the example environment file and configure as needed:

```bash
cp .env.example .env
```

### Available Variables

| Variable         | Default                 | Description                         |
| ---------------- | ----------------------- | ----------------------------------- |
| `VITE_APP_TITLE` | `React Starter Kit`     | Application title used in the UI    |
| `VITE_API_URL`   | `http://localhost:3001` | Base URL for backend API calls      |
| `VITE_PWA`       | `false`                 | Enable PWA in development mode      |
| `DOCKER`         | (auto-set)              | Automatically set by docker-compose |

<!-- OPTIONAL:PWA:START -->

### PWA Development Mode

Control PWA behavior in development:

```bash
# Disable PWA (default) - no service worker, no install icon
yarn dev

# Enable PWA for testing - full PWA functionality
VITE_PWA=true yarn dev
```

**Default behavior (`VITE_PWA=false`):**

- Service worker not registered
- Manifest link removed from HTML
- No install icon in browser
- Automatic cleanup of existing service workers

**Opt-in testing (`VITE_PWA=true`):**

- Full PWA functionality enabled
- Service worker registers and caches assets
- Install icon appears in browser
- Can test offline behavior

**Production:** PWA always enabled regardless of this setting.

<!-- OPTIONAL:PWA:END -->

<!-- OPTIONAL:DOCKER:START -->

### Docker Environment

When running in Docker, these variables are automatically configured:

- `DOCKER=true` - Disables browser auto-open
- `CHOKIDAR_USEPOLLING=true` - Enables file watching
- `WATCHPACK_POLLING=true` - Webpack file watching

<!-- OPTIONAL:DOCKER:END -->

See [.env.example](file:///Users/mventer011/Downloads/Personal/Other/Projects/ReactStarterKit/.env.example) for detailed documentation.

### Commands

```bash
yarn dev
yarn build
yarn preview

yarn lint
yarn lint:fix
yarn stylelint
yarn stylelint:fix
yarn format
yarn type-check

yarn setup
yarn setup:pwa
yarn setup:testing
yarn setup:husky
yarn setup:docker

yarn test          # Run tests in watch mode
yarn test:run      # Run tests once
yarn test:ui       # Open Vitest UI
yarn test:coverage # Generate coverage report
```

<!-- OPTIONAL:HUSKY:START -->

## 🪝 Git Hooks

This project optionally supports and uses [Husky](https://typicode.github.io/husky/) to enforce code quality through Git hooks:

### Pre-commit Hook

Automatically runs before each commit:

- **ESLint** with auto-fix on `.js/.ts/.jsx/.tsx` files
- **Stylelint** with auto-fix on `.css/.scss` files
- **Prettier** formatting on all staged files

### Commit Message Hook

Enforces [Conventional Commits](https://www.conventionalcommits.org/) format:

```bash
# Valid commit messages
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug in component"
git commit -m "docs: update README"
git commit -m "chore: update dependencies"

# Invalid - will be rejected
git commit -m "Added new feature"  # Missing type
git commit -m "FEAT: something"    # Uppercase type
```

**Valid types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`, `revert`

### Pre-push Hook

Runs before pushing to remote:

- **Type checking** with TypeScript
- **Build verification** to ensure code compiles

These hooks help maintain code quality and prevent broken code from entering the repository.

> **Note:** You can bypass hooks with `--no-verify` flag, but this is not recommended.

```bash
# Skip hooks (not recommended)
git commit -m "message" --no-verify
git push --no-verify
```

<!-- OPTIONAL:HUSKY:END -->

<!-- OPTIONAL:DOCKER:START -->

## 🐳 Docker

This project includes an optional production-ready Docker support with development and production configurations.

### Quick Start

**Development** (with hot-reload):

```bash
docker-compose up app
```

**Production** (optimised build):

```bash
docker-compose up app-prod
# or
docker build -t react-starter-kit . && docker run -p 8080:80 react-starter-kit
```

### Development Features

- **Hot-reload** - Live code updates without rebuilding
- **File watching** - Automatic polling for Docker compatibility (Mac/Windows)
- **Yarn cache** - Persistent cache volume for faster installs
- **Auto-install** - Dependencies installed on container start

### Production Features

- **Multi-stage builds** - Optimized ~25MB final image
- **Nginx web server** - Production-ready static file serving
- **Security hardening**:
  - Read-only filesystem
  - No new privileges
  - Minimal attack surface
- **Performance optimizations**:
  - Gzip compression
  - Immutable asset caching (1 year)
  - No-cache for index.html (instant updates)
- **PWA support**:
  - Service worker and manifest caching headers
  - CSP configured for PWA features
- **Health checks** - Container health monitoring endpoint

### Environment Variables

The Docker setup automatically configures:

- `DOCKER=true` - Disables browser auto-open in containers
- `CHOKIDAR_USEPOLLING=true` - Reliable file watching
- `WATCHPACK_POLLING=true` - Webpack file watching

<!-- OPTIONAL:PWA:START -->

### PWA in Docker

To test PWA features in Docker development:

```bash
# In docker-compose.yml, uncomment:
# - VITE_PWA=true

docker-compose up app
```

<!-- OPTIONAL:PWA:END -->

### Common Commands

```bash
# Development
docker-compose up app              # Start dev server
docker-compose down                # Stop containers
docker-compose logs -f app         # View logs

# Production
docker-compose up app-prod         # Start production preview
docker build -t react-starter-kit . # Build production image
docker images                      # List images
docker ps                          # List running containers

# Cleanup
docker-compose down -v             # Stop and remove volumes
docker system prune                # Clean up unused resources
```

### Dockerfile Details

**Build stage:**

- Node 18 Alpine base
- BuildKit cache mount for faster rebuilds
- Frozen lockfile for reproducible builds

**Production stage:**

- Nginx Alpine base
- Custom nginx.conf with:
  - SPA routing fallback
  - Security headers (CSP, X-Frame-Options, etc.)
  - Gzip compression
  - Optimized caching strategy
- Health check endpoint at `/health`

<!-- OPTIONAL:DOCKER:END -->

## 📁 Project Structure

```
src/
├── assets/
├── components/
├── contexts/
├── data/
├── hooks/
├── pages/
├── pwa/            # optional
├── routes/
├── sw/             # optional
├── styles/
├── types/
└── utils/
```

<!-- OPTIONAL:PWA:START -->

## 📱 PWA Features

This project includes optional Progressive Web App support with an intelligent opt-in strategy for development.

### PWA Capabilities

- **Offline support** - Works without internet connection
- **Install prompts** - Add to home screen on mobile/desktop
- **Service worker** - Automatic caching and updates
- **Manifest** - App metadata and icons
- **Runtime caching** - Images, fonts, and API responses

### Development Strategy

**Default behavior** (`VITE_PWA=false` or unset):

- Service worker **not registered**
- Manifest link **removed** from HTML
- No install icon in browser
- **Automatic cleanup** of existing service workers
- Prevents stale cache confusion during development

**Opt-in for testing** (`VITE_PWA=true`):

- Full PWA functionality enabled
- Service worker registers
- Install icon appears
- Test offline behavior and caching

**Production:**

- PWA **always enabled** regardless of env var
- Full offline support and caching

### Usage

```bash
# Regular development (no PWA)
yarn dev

# Test PWA features
VITE_PWA=true yarn dev

# Production (PWA always enabled)
yarn build && yarn preview
```

### Service Worker Cleanup

When switching from `VITE_PWA=true` to `VITE_PWA=false`, the app automatically:

1. Unregisters all service workers
2. Removes manifest link from HTML
3. Logs cleanup to console

This prevents stale cache issues and ensures a clean development experience.

### Removing PWA Support

To completely remove PWA from your project:

```bash
yarn setup:pwa
```

This will remove all PWA-related files, dependencies, and configurations.

<!-- OPTIONAL:PWA:END -->

<!-- OPTIONAL:TESTING:START -->

## 🧪 Testing

Optional testing setup using Vitest and React Testing Library.

```bash
yarn test
yarn test:run
yarn test:ui
yarn test:coverage
```

Tests are colocated next to components, hooks, and utilities.

<!-- OPTIONAL:TESTING:END -->

## 🌐 Internationalisation (i18n)

The template ships with a ready-to-use i18next integration. All UI strings are
extracted into `src/i18n/locales/en.json` so they can be translated without
touching component code.

### Adding a new locale

1. Create `src/i18n/locales/<code>.json` (copy `en.json` as a starting point).
2. Import it in `src/i18n/index.ts` and add it to the `resources` map.
3. Set `lng` to your desired default, or use a language detector plugin.

### Using translations in a component

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t('notFound.title')}</h1>;
}
```

### Removing i18n

Run `yarn setup` and deselect **Internationalisation (i18n)**. The setup script
will delete `src/i18n/`, revert `App.tsx`, and remove the `i18next` and
`react-i18next` packages.

## 📄 License

Private and proprietary.
