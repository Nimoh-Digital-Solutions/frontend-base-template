# create-nimoh-app — Improvement Findings

> Audit date: 2026-03-23
> Scope: `create-nimoh-app`, `create-tast-app`, `nimoh-base init` CLI + templates

---

## A. Developer Experience — Fewer Prompts, Smarter Defaults

### A1. Pre-fill more BE CLI values in the temp YAML config

- **File:** `packages/create-nimoh-app/src/backend.ts` → `writeTempConfig()`
- **Problem:** Only 4 fields are pre-filled (`project_name`, `project_slug`, `port_offset`, `frontend_url`). The user must then answer ~15 more interactive prompts from `nimoh-base init`, many of which have obvious defaults derivable from the project name.
- **Fix:** Pre-fill these additional fields:
  - `site_name` → `projectName` (title-case)
  - `support_email` → `support@{slug}.example`
  - `noreply_email` → `noreply@{slug}.example`
  - `cache_key_prefix` → first 8 chars of slug
  - `celery_app_name` → slug
  - `db_name` → `{slug}_db`
  - `use_celery: true`, `use_channels: true`, `use_monitoring: true`, `use_privacy: true`

  **Do NOT pre-fill:** `db_user` and `db_password` — these should always be prompted interactively (security-sensitive, and the slug is not a good default for a database user).

  This would reduce the interactive BE prompts from ~15 to ~6 (db_user, db_password, email config, social auth).

### A2. Add `--yes` / `-y` non-interactive flag to `create-nimoh-app`

- **File:** `packages/create-nimoh-app/src/index.ts`
- **Problem:** No way to skip prompts. `create-tast-app` already has `--yes`, but the orchestrator doesn't.
- **Fix:** Support `--yes` to accept all defaults (project name from arg, port offset 0, pass `--no-input` to BE CLI, pass `--yes` to FE CLI). Great for CI/testing.

### A3. BE CLI prompt ordering — `port_offset` asked AFTER `frontend_url`

- **File:** `nimoh-be-django-base/src/nimoh_base/cli/prompts.py` (lines 217, 263)
- **Problem:** `frontend_url` is prompted at line 217 with default `http://localhost:3000`, but `port_offset` is prompted at line 263. If run standalone (not via `create-nimoh-app`), a user can't give the right frontend URL because they haven't chosen an offset yet.
- **Fix:** Move `port_offset` prompt before `frontend_url`, and auto-derive the frontend URL default: `http://localhost:{3000 + port_offset}`.

### A4. FE scaffold asks redundant prompts when called from `create-nimoh-app`

- **File:** `packages/create-nimoh-app/src/frontend.ts`
- **Problem:** `create-tast-app` is invoked with name + port offset, but still asks for description, brand colours, feature toggles (Docker, PWA, Husky, Tailwind), package manager, and install deps. For a solo dev with consistent preferences, this is ~8 unnecessary prompts every time.
- **Fix:** Pass `--yes` from `create-nimoh-app` to `create-tast-app` when user wants defaults, or add a `--defaults` flag that enables all features and skips cosmetic prompts.

### A5. Summary doesn't show actual ports used

- **File:** `packages/create-nimoh-app/src/index.ts` → `printSummary()`
- **Problem:** The summary only shows BE and FE dev ports. Missing: Redis port, FE prod port, and the actual Docker commands.
- **Fix:** Add all ports and show Docker-specific quick-start commands too.

---

## B. Generated Project Quality — Better Config, Fewer Manual Fixes

### B1. `.env.example.j2` has duplicate ALLOWED_HOSTS (bug)

- **File:** `nimoh-be-django-base/src/nimoh_base/project_template/.env.example.j2` (lines 8 and 45)
- **Problem:** `ALLOWED_HOSTS` is defined twice. The first (`localhost,127.0.0.1`) is incomplete; the second (`localhost,127.0.0.1,backend`) is correct. In a `.env` file the last value wins, but this is confusing.
- **Fix:** Remove the first definition (line 8), keep only the Docker-aware one.

### B2. Root `Makefile` runs BE and FE sequentially, not in parallel

- **File:** `packages/create-nimoh-app/src/root-files.ts` → `rootMakefile()`
- **Problem:** `make start` runs `cd backend && make dev` (which blocks), so `cd frontend && make docker-dev` never executes.
- **Fix:** Use `&` for backgrounding or a tool like `concurrently`. Alternatively, restructure as `make start-be` / `make start-fe` / `make start` (with trap for cleanup). Example:
  ```makefile
  start:
  	@cd backend && make dev &
  	@cd frontend && make docker-dev &
  	@wait
  ```

### ~~B3. Root `.gitignore` ignores `.claude/` and `.github/` but we also create those directories~~ (Intentional)

- **Status:** Not an issue. Both directories are intentionally created as local-only placeholders and ignored by git. `.claude/` holds local AI config; `.github/` holds local GitHub/Copilot config. Neither should be committed.

### B4. FE `.gitignore` still has monorepo entries after scaffolding

- **File:** FE template's `.gitignore` (from cloned repo)
- **Problem:** Entries like `packages/*/dist/` remain after the monorepo structure is removed.
- **Fix:** Add a patch in `create-tast-app/src/scaffold.ts` to clean up monorepo-specific gitignore entries.

### B5. FE `.github/workflows/` not patched after clone

- **File:** `packages/create-tast-app/src/scaffold.ts` — missing patch
- **Problem:** If the template repo has `.github/workflows/` with CI config, those files still reference `yarn workspace @nimoh-digital-solutions/...` commands and monorepo structure.
- **Fix:** Patch the workflow files to use standalone commands instead of monorepo workspace references.

### B6. `redis_url` in temp config doesn't account for port offset

- **File:** `packages/create-nimoh-app/src/backend.ts` → `writeTempConfig()`
- **Problem:** Redis URL defaults to `redis://localhost:6379/0` but with port offset it should be `redis://localhost:{6379+offset}/0`. The BE CLI's `_build_context` correctly computes `be_redis_port`, but the interactive prompt default is still `6379`.
- **Fix:** Add `redis_url: "redis://localhost:${6379 + portOffset}/0"` to the temp config.

### B7. No root `README.md` generated

- **File:** `packages/create-nimoh-app/src/root-files.ts`
- **Problem:** The scaffolded project has no top-level README. Both `backend/` and `frontend/` get their own READMEs, but a new developer cloning this repo has no entry point.
- **Fix:** Generate a root `README.md` with project name, structure overview, prerequisite list, and quick-start commands (similar to the `printSummary` output but persistent).

### B8. No root `.env.example` for shared environment variables

- **Problem:** Both BE and FE have their own `.env.example` files inside their own dirs and read variables from those. There's no root-level one. If we add a root `.env.example` (e.g. with `APP_NAME`), both the BE and FE would need to be made aware of it — their settings/config loaders would need to also read from `../.env` (the parent directory) in addition to their own local `.env`.
- **Fix:** Generate a root `.env.example` with shared vars like `APP_NAME={projectName}`. Then patch both the BE settings (e.g. `django-environ` reads `../.env` as a fallback) and the FE Vite config (`envDir: '../'` or explicit dotenv loading) so they pick up root-level variables alongside their own. This requires changes across three layers (scaffolder + BE template + FE template).

---

## C. Robustness & Error Handling

### C1. FE regex patches fail silently if template format changes

- **File:** `packages/create-tast-app/src/scaffold.ts` (throughout)
- **Problem:** All `content.replace(/<regex>/, ...)` calls return the same string if the pattern doesn't match — no warning logged. If the template changes its HTML title format, Vite config structure, or docker-compose layout, the scaffold appears to succeed but produces a broken project.
- **Fix:** After each critical replacement, check if the content actually changed. Log a warning if not. Could be a utility: `assertReplaced(original, result, description)`.

### C2. `initRootGit` errors not handled

- **File:** `packages/create-nimoh-app/src/index.ts` → `initRootGit()`
- **Problem:** `exec('git init', ...)`, `exec('git add -A', ...)`, `exec('git commit -m ...')` — none check the return code. If git is configured with a hook that rejects the commit, the scaffold "succeeds" with no git history.
- **Fix:** Check `result.success` and at minimum log a warning.

### C3. `hoistDirectory` silently skips collisions

- **File:** `packages/create-nimoh-app/src/backend.ts` → `hoistDirectory()`
- **Problem:** If the BE CLI generates a file with the same name as something already in `backendDir` (beyond `.venv`), it's silently skipped with `if (exists(dest)) continue`. Could lose generated files.
- **Fix:** Log which files were skipped and why.

---

## D. Priority Ranking

| #      | Issue                                                  | Impact                   | Effort      |
| ------ | ------------------------------------------------------ | ------------------------ | ----------- |
| **A1** | Pre-fill more BE config values                         | High (saves ~10 prompts) | Low         |
| **B2** | Root Makefile sequential blocking                      | High (start cmd broken)  | Low         |
| **B1** | Duplicate ALLOWED_HOSTS                                | Medium (confusing)       | Trivial     |
| **A3** | BE prompt ordering (port_offset before frontend_url)   | Medium                   | Low         |
| **B6** | Redis URL not offset-aware                             | Medium (wrong default)   | Trivial     |
| **B7** | No root README.md                                      | Medium (poor DX)         | Low         |
| **C1** | Silent regex failures                                  | Medium (hard to debug)   | Medium      |
| **A4** | FE redundant prompts                                   | Medium (annoying)        | Low-Medium  |
| **B5** | FE workflows not patched                               | Medium                   | Medium      |
| **A2** | `--yes` flag                                           | Nice-to-have             | Low         |
| **B4** | FE gitignore monorepo entries                          | Low                      | Trivial     |
| **C2** | Git init error handling                                | Low                      | Trivial     |
| **A5** | Summary missing ports                                  | Low                      | Trivial     |
| **B8** | Root .env.example                                      | Low                      | Low         |
| **C3** | hoistDirectory collision logging                       | Low                      | Trivial     |
