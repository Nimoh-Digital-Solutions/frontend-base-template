import path from 'path';

import { logOk, logStep, mkdirp, writeText } from './utils.js';

// ─── Root-level files created after backend + frontend are scaffolded ────────

interface RootFilesOpts {
  projectName: string;
  projectRoot: string;
}

/**
 * Create root-level configuration files (`.gitignore`, `Makefile`) and
 * placeholder directories (`.github/`, `.claude/`) at the monorepo root.
 */
export function createRootFiles({ projectName, projectRoot }: RootFilesOpts): void {
  logStep('Creating root-level project files');

  // .gitignore
  writeText(path.join(projectRoot, '.gitignore'), rootGitignore(projectName));
  logOk('.gitignore');

  // Makefile
  writeText(path.join(projectRoot, 'Makefile'), rootMakefile());
  logOk('Makefile');

  // Placeholder directories
  mkdirp(path.join(projectRoot, '.github'));
  logOk('.github/');

  mkdirp(path.join(projectRoot, '.claude'));
  logOk('.claude/');
}

// ─── File contents ───────────────────────────────────────────────────────────

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
  return `.DEFAULT: start



start: # start both the BE server and the FE server
\t@echo "Starting the BE server and the FE server..."
\t@cd backend && make dev
\t@echo "BE server started."
\t@cd frontend && make docker-dev
\t@echo "FE server started."
`;
}
