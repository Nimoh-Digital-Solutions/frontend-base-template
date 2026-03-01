# create-tast-app — Improvement Roadmap

## Critical Fixes

> These cause real build failures in scaffolded apps and should be addressed first.

### 1. Clean tsconfig workspace paths

After `packages/` is deleted during scaffold, `tsconfig.json` still contains paths like:

```json
"@nimoh-digital-solutions/tast-utils": ["../packages/tast-utils/src/index.ts"]
```

These resolve to nothing in a standalone app → **TypeScript errors**.

**Fix:** Strip workspace-specific `paths` entries from `tsconfig.json` during scaffold.

### 2. Remove Sentry / auth leftover imports

`main.tsx` references `initSentry` / `captureException`; `App.tsx` references `useInitAuth`, `PwaUpdateBanner`.  
These are template-specific modules. If the scaffolded app doesn't ship those, the **build breaks**.

**Fix:** Clean up template-specific imports from `main.tsx` and `App.tsx` during scaffold.

### 3. `printNextSteps` always shows Docker instructions

The "Next steps" banner unconditionally prints Docker / NPM_TOKEN guidance even when the user chose to disable Docker.

**Fix:** Conditionally print Docker steps only when `enableDocker` is true.

### 4. Dead code removal

~30 lines of unused functions remain in `scaffold.ts`:

- `derivePalette()` — defined but never called
- `hslToHex()` — only used by `derivePalette()`
- `normHex()` — partially dead (used in `derivePalette` path)

**Fix:** Remove `derivePalette` and `hslToHex`; keep `normHex` only if still referenced.

---

## High-Value Features

### 5. `git init` + initial commit after scaffold

Currently the scaffolded directory has **no `.git`** — the cloned history is stripped but no fresh repo is initialised.

### 6. `--yes` / `-y` flag for non-interactive mode

Accept all defaults without prompting. Essential for CI pipelines and scripting.

### 7. Remove `nginx/` directory when Docker is disabled

`removeDocker()` deletes `nginx.conf` at root but misses the `nginx/` directory (e.g. `nginx/security_headers.conf`).

### 8. Add `"engines"` field to package.json

Declare `"engines": { "node": ">=18" }` — the package targets Node 18+ but doesn't enforce it.

### 9. Check `git` availability before clone

If `git` is not installed, the clone error is opaque. Add a friendly check with a clear message.

---

## Nice-to-Have Improvements

### 10. Use `degit` instead of `git clone`

Downloads a tarball — faster, no `.git` to clean up, works without full git history.

### 11. Spinner / progress indicator

Replace plain `console.log` with `ora` or similar for long-running steps (clone, install).

### 12. Rollback on failure

If scaffold crashes mid-way, clean up the partially-created directory automatically.

### 13. `.env.local` generation

Copy `.env.example` → `.env.local` with the user's app title pre-filled.

### 14. Testing framework choice prompt

Let users pick Vitest / Jest / none instead of always including Vitest.

### 15. State management choice prompt

Not everyone wants Zustand — offer Zustand / Jotai / Redux Toolkit / none.

### 16. Config file (`.tastrc.json`)

Pre-define answers to prompts for team-standardised scaffolding.

### 17. Test coverage

The package currently has **zero tests**. Add at minimum:

- Unit tests for `utils.ts` helpers (pure functions)
- Integration test that scaffolds into a temp directory and verifies the output structure
- Snapshot tests for generated `package.json` / config files
