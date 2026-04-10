import path from 'path';

import { logOk, logStep, mkdirp, writeText } from './utils.js';

// ─── Root-level files created after backend + frontend are scaffolded ────────

interface RootFilesOpts {
  projectName: string;
  portOffset: number;
  projectRoot: string;
  includeMobile?: boolean;
}

/**
 * Create root-level configuration files (`.gitignore`, `Makefile`) and
 * placeholder directories (`.github/`, `.claude/`) at the monorepo root.
 */
export function createRootFiles({
  projectName,
  portOffset,
  projectRoot,
  includeMobile,
}: RootFilesOpts): void {
  logStep('Creating root-level project files');

  const mobile = !!includeMobile;

  // .gitignore
  writeText(path.join(projectRoot, '.gitignore'), rootGitignore(projectName, mobile));
  logOk('.gitignore');

  // Makefile
  writeText(path.join(projectRoot, 'Makefile'), rootMakefile(mobile));
  logOk('Makefile');

  // README.md
  writeText(path.join(projectRoot, 'README.md'), rootReadme(projectName, portOffset, mobile));
  logOk('README.md');

  // .env.example — shared env vars used by docker-compose and Makefile
  writeText(path.join(projectRoot, '.env.example'), rootEnvExample(projectName, mobile));
  logOk('.env.example');

  // Placeholder directories
  mkdirp(path.join(projectRoot, '.github'));
  logOk('.github/');

  mkdirp(path.join(projectRoot, '.claude'));
  logOk('.claude/');

  if (mobile) {
    // .github/workflows/ci.yml
    const workflowsDir = path.join(projectRoot, '.github', 'workflows');
    mkdirp(workflowsDir);
    writeText(path.join(workflowsDir, 'ci.yml'), githubCi(projectName));
    logOk('.github/workflows/ci.yml');

    // .github/dependabot.yml
    writeText(path.join(projectRoot, '.github', 'dependabot.yml'), githubDependabot());
    logOk('.github/dependabot.yml');
  }
}

// ─── File contents ───────────────────────────────────────────────────────────

function rootReadme(projectName: string, portOffset: number, mobile: boolean): string {
  const bePort = 8000 + portOffset;
  const feDevPort = 3000 + portOffset;
  const feProdPort = 8080 + portOffset;
  const titleName = projectName
    .split(/[-_\s]+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const subtitle = mobile
    ? 'Full-stack application: Django backend + React/Vite frontend + Expo mobile app.'
    : 'Full-stack application: Django backend + React/Vite frontend.';

  const mobileStructure = mobile
    ? `  mobile/           Expo (React Native) mobile app
  packages/
    shared/         Shared TypeScript types, schemas, i18n, utils
`
    : '';

  const mobilePrereqs = mobile
    ? `- Expo CLI (\`npx expo\`)
- Xcode (iOS) / Android Studio (Android)
`
    : '';

  const mobileQuickStart = mobile
    ? `
### Mobile

\`\`\`bash
cd mobile
npx expo start
# Scan QR code with Expo Go or press i/a for simulators
\`\`\`
`
    : '';

  const mobilePortRow = mobile
    ? `| Mobile (Expo dev) | 8081 (default) |
`
    : '';

  return `# ${titleName}

${subtitle}

## Structure

\`\`\`
${projectName}/
  backend/          Django API (DRF + nimoh-be-django-base)
    .venv/          Python virtual environment
  frontend/         React app (Vite + TypeScript)
${mobileStructure}  .gitignore        Root ignore rules
  Makefile          Root dev commands
  .github/          GitHub config (local)
  .claude/          Claude AI config (local)
\`\`\`

## Prerequisites

- Python >= 3.12
- Node.js >= 18
- Docker & Docker Compose
- Git
${mobilePrereqs}
## Quick Start

### Both (parallel)

\`\`\`bash
make start
\`\`\`

### Backend only

\`\`\`bash
cd backend
source .venv/bin/activate
make dev
# → http://localhost:${bePort}
\`\`\`

### Frontend only

\`\`\`bash
cd frontend
yarn dev        # or: make docker-dev
# → http://localhost:${feDevPort} (dev)
# → http://localhost:${feProdPort} (prod/nginx)
\`\`\`
${mobileQuickStart}
## Ports

| Service         | Port  |
| --------------- | ----- |
| Backend (Django) | ${bePort} |
| Frontend (Vite dev) | ${feDevPort} |
| Frontend (nginx prod) | ${feProdPort} |
${mobilePortRow}`;
}

function rootEnvExample(projectName: string, mobile: boolean): string {
  const mobileSection = mobile
    ? `
# ─── Mobile (Expo / React Native) ────────────────────────────────────────────
# See mobile/.env.example for Expo-specific variables
# EXPO_PUBLIC_API_URL is also set per EAS build profile in mobile/eas.json
`
    : '';

  return `# =============================================================================
# ${projectName} — shared environment variables
# =============================================================================
# Copy to .env and edit as needed:   cp .env.example .env
#
# These variables are read by docker-compose and the root Makefile.
# For service-specific configuration see:
#   backend/.env.example   — Django settings
#   frontend/.env.example  — Vite / React settings${mobile ? '\n#   mobile/.env.example   — Expo / React Native settings' : ''}

# Used by docker-compose \`name:\` field and container naming
APP_NAME=${projectName}
${mobileSection}`;
}

function rootGitignore(projectName: string, mobile: boolean): string {
  const mobileSection = mobile
    ? `
# =============================================================================
# Expo / React Native
# =============================================================================
.expo/
ios/
android/
*.jks
*.p8
*.p12
*.key
*.mobileprovision
*.orig.*
web-build/

`
    : '';

  return `# =============================================================================
# ${projectName} — root .gitignore (monorepo: Django backend + React/Vite frontend${mobile ? ' + Expo mobile' : ''})
# =============================================================================

# Legacy / local-only directories — not part of the active codebase
base-app/
docs/
.claude/
app-audit.md

# =============================================================================
# Secrets & environment variables  ⚠️  NEVER commit real .env files
# =============================================================================
.env
.env.*
!.env.example
!.env.*.example
*.local
*.local.md

# =============================================================================
# Node / Frontend
# =============================================================================
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
.yarn/cache
.yarn/unplugged
.yarn/build-state.yml
.yarn/install-state.gz
.pnp.*

# Build output
dist/
dist-ssr/
build/

# Vite
.vite/
vite.config.ts.timestamp-*
stats.html

# TypeScript
*.tsbuildinfo

# Testing & coverage
coverage/
.nyc_output/
test-results/
playwright-report/
blob-report/

# PWA / Service worker  (generated at build time — do not commit)
public/sw.js
public/sw.js.map
public/workbox-*.js
public/workbox-*.js.map
sw.js
sw.js.map

# SCSS / CSS tooling
.sass-cache/
*.css.map

# =============================================================================
# Python / Django backend
# =============================================================================
__pycache__/
*.py[cod]
*$py.class
*.so
*.egg
*.egg-info/
.eggs/
MANIFEST
.installed.cfg
pip-wheel-metadata/
share/python-wheels/
.Python

# Virtual environments
.venv/
venv/
ENV/
env/
env.bak/
venv.bak/

# pytest / coverage
.pytest_cache/
htmlcov/
.coverage
.coverage.*
coverage.xml
*.cover
nosetests.xml
.tox/

# Ruff / linting caches
.ruff_cache/
.mypy_cache/
.dmypy.json
dmypy.json

# Django artefacts
staticfiles/
mediafiles/
*.sqlite3

# Celery
celerybeat-schedule
celerybeat.pid

${mobileSection}# =============================================================================
# Docker
# =============================================================================
.docker/

# =============================================================================
# Logs
# =============================================================================
logs/
*.log

# =============================================================================
# IDEs & editors
# =============================================================================
.vscode/
.idea/
*.sublime-project
*.sublime-workspace
*.swp
*.swo
*~

# =============================================================================
# OS artefacts
# =============================================================================
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# =============================================================================
# GitHub Copilot / AI config  (local-only, never pushed)
# =============================================================================
.github/agents/
.github/copilot-instructions.md
.github/instructions/
.github/prompts/
.github/skills/

# =============================================================================
# Misc project-local artefacts
# =============================================================================
ANALYSIS-*.md
docs/claude-artefacts/*


# =============================================================================
# Anything in the .context directory is local-only and should never be committed
# =============================================================================
.context/
Support/
AGENTS.md
`;
}

function rootMakefile(mobile: boolean): string {
  const mobileStart = mobile
    ? `\t@cd mobile && npx expo start --port 8081 &\n`
    : '';

  const mobileTargets = mobile
    ? `
start-mobile: ## Start Expo dev server
\t@cd mobile && npx expo start

lint-shared: ## Type-check shared packages
\t@cd packages/shared && npx tsc --noEmit

`
    : '';

  const startComment = mobile
    ? 'Start BE, FE, and mobile servers in parallel'
    : 'Start both the BE and FE servers in parallel';

  return `.DEFAULT_GOAL := start

start: ## ${startComment}
\t@echo "Starting services…"
\t@cd backend && make dev &
\t@cd frontend && make docker-dev &
${mobileStart}\t@wait

start-be: ## Start backend only
\t@cd backend && make dev

start-fe: ## Start frontend only
\t@cd frontend && make docker-dev
${mobileTargets}stop: ## Stop all running services
\t@echo "Stopping services…"
\t-@cd backend && make dev-down 2>/dev/null
\t-@cd frontend && docker compose down 2>/dev/null${mobile ? '\n\t-@pkill -f "expo start" 2>/dev/null' : ''}
\t@echo "Done."
`;
}

// ─── GitHub Actions CI ──────────────────────────────────────────────────────

function githubCi(projectName: string): string {
  return `name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  backend:
    name: Backend (Python)
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: ci
          POSTGRES_PASSWORD: ci
          POSTGRES_DB: ${projectName.replace(/-/g, '_')}_test
        ports: ["5432:5432"]
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        ports: ["6379:6379"]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: pip install -e ".[dev,test]"
      - run: ruff check .
      - run: ruff format --check .
      - run: pytest --tb=short -q

  frontend:
    name: Frontend (Node)
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: corepack enable
      - run: yarn install --immutable
      - run: yarn lint
      - run: npx tsc --noEmit
      - run: yarn test --run

  mobile:
    name: Mobile (Expo)
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: mobile
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: yarn install
      - run: npx tsc --noEmit
      - run: yarn test --ci

  shared:
    name: Shared packages
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: packages/shared
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npx tsc --noEmit
`;
}

// ─── Dependabot ─────────────────────────────────────────────────────────────

function githubDependabot(): string {
  return `version: 2
updates:
  - package-ecosystem: pip
    directory: /backend
    schedule:
      interval: weekly
    open-pull-requests-limit: 10

  - package-ecosystem: npm
    directory: /frontend
    schedule:
      interval: weekly
    open-pull-requests-limit: 10

  - package-ecosystem: npm
    directory: /mobile
    schedule:
      interval: weekly
    open-pull-requests-limit: 10

  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 5
`;
}
