import path from 'path';

import { logOk, logStep, mkdirp, writeText } from './utils.js';

// ─── Root-level files created after backend + frontend are scaffolded ────────

interface RootFilesOpts {
  projectName: string;
  portOffset: number;
  projectRoot: string;
}

/**
 * Create root-level configuration files (`.gitignore`, `Makefile`) and
 * placeholder directories (`.github/`, `.claude/`) at the monorepo root.
 */
export function createRootFiles({ projectName, portOffset, projectRoot }: RootFilesOpts): void {
  logStep('Creating root-level project files');

  // .gitignore
  writeText(path.join(projectRoot, '.gitignore'), rootGitignore(projectName));
  logOk('.gitignore');

  // Makefile
  writeText(path.join(projectRoot, 'Makefile'), rootMakefile());
  logOk('Makefile');

  // README.md
  writeText(path.join(projectRoot, 'README.md'), rootReadme(projectName, portOffset));
  logOk('README.md');

  // .env.example — shared env vars used by docker-compose and Makefile
  writeText(path.join(projectRoot, '.env.example'), rootEnvExample(projectName));
  logOk('.env.example');

  // Placeholder directories
  mkdirp(path.join(projectRoot, '.github'));
  logOk('.github/');

  mkdirp(path.join(projectRoot, '.claude'));
  logOk('.claude/');
}

// ─── File contents ───────────────────────────────────────────────────────────

function rootReadme(projectName: string, portOffset: number): string {
  const bePort = 8000 + portOffset;
  const feDevPort = 3000 + portOffset;
  const feProdPort = 8080 + portOffset;
  const titleName = projectName
    .split(/[-_\s]+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return `# ${titleName}

Full-stack application: Django backend + React/Vite frontend.

## Structure

\`\`\`
${projectName}/
  backend/          Django API (DRF + nimoh-be-django-base)
    .venv/          Python virtual environment
  frontend/         React app (Vite + TypeScript)
  .gitignore        Root ignore rules
  Makefile          Root dev commands
  .github/          GitHub config (local)
  .claude/          Claude AI config (local)
\`\`\`

## Prerequisites

- Python >= 3.12
- Node.js >= 18
- Docker & Docker Compose
- Git

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

## Ports

| Service         | Port  |
| --------------- | ----- |
| Backend (Django) | ${bePort} |
| Frontend (Vite dev) | ${feDevPort} |
| Frontend (nginx prod) | ${feProdPort} |
`;
}

function rootEnvExample(projectName: string): string {
  return `# =============================================================================
# ${projectName} — shared environment variables
# =============================================================================
# Copy to .env and edit as needed:   cp .env.example .env
#
# These variables are read by docker-compose and the root Makefile.
# For service-specific configuration see:
#   backend/.env.example   — Django settings
#   frontend/.env.example  — Vite / React settings

# Used by docker-compose \`name:\` field and container naming
APP_NAME=${projectName}
`;
}

function rootGitignore(projectName: string): string {
  return `# =============================================================================
# ${projectName} — root .gitignore (monorepo: Django backend + React/Vite frontend)
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

# =============================================================================
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

function rootMakefile(): string {
  return `.DEFAULT_GOAL := start

start: ## Start both the BE and FE servers in parallel
\t@echo "Starting backend and frontend…"
\t@cd backend && make dev &
\t@cd frontend && make docker-dev &
\t@wait

start-be: ## Start backend only
\t@cd backend && make dev

start-fe: ## Start frontend only
\t@cd frontend && make docker-dev

stop: ## Stop all running services
\t@echo "Stopping services…"
\t-@cd frontend && docker compose down 2>/dev/null
\t-@pkill -f "manage.py runserver" 2>/dev/null
\t@echo "Done."
`;
}
