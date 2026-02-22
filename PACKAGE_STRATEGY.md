# Making This Template a Reusable GitHub Package

## The Core Problem

When you create an app from a plain GitHub template repository, the new app is an **independent copy** of the snapshot at creation time. Template updates never reach existing apps — you'd have to manually copy files across indefinitely. That doesn't scale.

The goal here is a system where:
1. New apps are scaffolded from a canonical source in one command
2. Ongoing updates (new components, bug fixes, config improvements) can be pulled into existing apps with a version bump
3. Each app still controls its own pages, routes, and business logic

---

## Option Comparison

Before committing to a single path, here are the three viable strategies:

| Strategy | Propagates updates? | Effort | Best for |
|---|---|---|---|
| **A — GitHub Template only** | ❌ No (copy-paste manually) | None | One-off scaffolding with no shared upgrades |
| **B — Shared npm packages on GitHub Packages** | ✅ Yes, via `yarn upgrade` | Medium–high | Sustained ecosystem of apps sharing UI/utils |
| **C — CLI scaffolder (`create-tast-app`)** | ⚠️ Partially (re-run or codemods) | High | When app structure itself must stay in sync |

**The recommended path is B**, implemented progressively over the phases below.  
Options A and C are stepping stones to B, not alternatives.

---

## Recommended Architecture

Split the current repo into two concerns:

```
github.com/you/tast-core          ← packages you publish (the "library")
github.com/you/tast-app-template  ← thin app shell that consumes tast-core
```

Apps you build in future:
```
my-new-app  ←  installs @you/tast-core, scaffolded from tast-app-template
```

When you fix a bug in `Button` or add a new hook to `tast-core`, apps pull it:
```sh
yarn upgrade @yourscope/tast-ui @yourscope/tast-utils
```

---

## What Gets Packaged vs Stays Per-App

Understanding this boundary is critical before starting.

### Packageable (goes into tast-core packages)
| Area | Current location | Package candidate |
|---|---|---|
| Components | `src/components/` | `@yourscope/tast-ui` |
| Hooks | `src/hooks/` | `@yourscope/tast-hooks` |
| Utilities | `src/utils/` | `@yourscope/tast-utils` |
| HTTP service | `src/services/` | `@yourscope/tast-utils` |
| Types | `src/types/common.ts` | included in each package |
| ThemeContext | `src/contexts/` | `@yourscope/tast-ui` |
| Design tokens + SCSS | `src/styles/` | `@yourscope/tast-styles` |
| ESLint config | `eslint.config.js` | `@yourscope/eslint-config` |
| TypeScript config | `tsconfig.json` | `@yourscope/tsconfig` |
| Stylelint config | `.stylelintrc.json` | `@yourscope/stylelint-config` |

### Stays Per-App (lives in the app shell template)
| Area | Reason |
|---|---|
| `src/pages/` | App-specific content |
| `src/routes/` | App-specific routing |
| `src/main.tsx`, `App.tsx` | App entry points |
| `src/layouts/` | Optionally packageable, but often app-specific |
| `vite.config.ts` | App-specific aliases and plugins |
| `Dockerfile`, `nginx.conf` | Infrastructure, largely stable |
| `.env*` files | App-specific environment |

---

## Phased Action Plan

---

### Phase 1 — GitHub Template Repository (Do This Now)

**Complexity:** Very low | **Value:** Immediate

The current repo becomes a proper GitHub Template so new apps can be scaffolded in seconds.

#### Steps

1. **Set GitHub repo to "Template repository"**
   - GitHub → repo Settings → check `Template repository`
   - Developers can now click **"Use this template"** or run:
     ```sh
     gh repo create my-new-app --template yourname/tast-fe-app --private --clone
     ```

2. **Add a `TEMPLATE_VERSION` file** to the root — a plain text file with the current version (e.g. `1.0.0`). Apps created from this template can track which version they started from, making manual diff-based updates easier later.

3. **Protect the `main` branch**
   - GitHub → Settings → Branches → Add rule: require PR + status checks

4. **Add GitHub Actions CI** — run `yarn check` on every push/PR so template health is always verified before someone creates a new app from it.

   Create `.github/workflows/ci.yml`:
   ```yaml
   name: CI
   on: [push, pull_request]
   jobs:
     check:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with: { node-version: 22, cache: yarn }
         - run: yarn install --frozen-lockfile
         - run: yarn type-check
         - run: yarn lint
         - run: yarn stylelint
         - run: yarn test:run
   ```

**Deliverable:** Any new app is two clicks / one CLI command away. No code changes to the template itself.

---

### Phase 2 — Shareable Config Packages (Quickest update propagation win)

**Complexity:** Low | **Value:** High for consistency across apps

The three config files (ESLint, TypeScript, Stylelint) fluctuate the most over time and are the most painful to keep in sync manually. Extract them first.

#### 2a — Create `packages/` directory in the template repo

Turn the template repo into a **pnpm/yarn workspace** (monorepo-lite):

```
tast-fe-app/
├── packages/
│   ├── eslint-config/
│   │   ├── package.json  { "name": "@yourscope/eslint-config" }
│   │   └── index.js      ← current eslint.config.js rules
│   ├── tsconfig/
│   │   ├── package.json  { "name": "@yourscope/tsconfig" }
│   │   └── base.json     ← current tsconfig.json compiler options
│   └── stylelint-config/
│       ├── package.json  { "name": "@yourscope/stylelint-config" }
│       └── index.json    ← current .stylelintrc.json
└── (app shell files)
```

#### 2b — Publish to GitHub Packages

Add to each `packages/*/package.json`:
```json
{
  "name": "@yourscope/eslint-config",
  "version": "1.0.0",
  "publishConfig": { "registry": "https://npm.pkg.github.com" }
}
```

Authenticate once per machine:
```sh
echo "//npm.pkg.github.com/:_authToken=YOUR_GH_PAT" >> ~/.npmrc
```

Publish:
```sh
cd packages/eslint-config && npm publish
```

#### 2c — Consume in apps

In any app:
```sh
yarn add -D @yourscope/eslint-config @yourscope/tsconfig @yourscope/stylelint-config
```

```js
// eslint.config.js
import sharedConfig from '@yourscope/eslint-config';
export default [...sharedConfig, { /* app-specific overrides */ }];
```

```json
// tsconfig.json
{ "extends": "@yourscope/tsconfig/base.json", "compilerOptions": { /* app overrides */ } }
```

When you update a lint rule in the package and bump the version, apps run `yarn upgrade @yourscope/eslint-config` and they're up to date.

**Deliverable:** Config changes propagate to all apps via a single version bump.

---

### Phase 3 — Core Library Package `@yourscope/tast-ui` and `@yourscope/tast-utils`

**Complexity:** Medium | **Value:** Very high (components + hooks + utilities stay in sync)

This is the most impactful phase — shared UI components and utilities become a versioned dependency.

#### 3a — Build setup for the library packages

Each package needs to compile itself (not rely on the consumer's Vite build). Use **tsup** — it's the simplest zero-config bundler for TypeScript libraries.

```sh
yarn add -D tsup -W   # add to workspace root
```

`packages/tast-ui/tsup.config.ts`:
```ts
import { defineConfig } from 'tsup';
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,              // emit .d.ts declarations
  sourcemap: true,
  external: ['react', 'react-dom'],  // peer deps, not bundled
});
```

#### 3b — The SCSS challenge

The current components use **SCSS Modules** with `@use '@styles'` Vite aliases. These aliases don't resolve outside the app build — a package consumer's Vite won't know about them.

**Three options (pick one):**

| Option | How | Trade-off |
|---|---|---|
| **Option 1 — Compile CSS into the package** | tsup/vite lib mode compiles SCSS to CSS; package ships pre-compiled CSS | Simplest for consumers, but apps can't customise design tokens |
| **Option 2 — Distribute raw SCSS; consumers configure alias** | Package ships `.scss` source; consumers add `@yourscope/tast-ui` to Vite `resolve.alias` | Full token customisation, but consumer config setup required |
| **Option 3 — CSS Custom Properties only (no Sass in package boundary)** | Remove SCSS from component packages; components reference only CSS vars (`var(--color-primary)`); token SCSS lives in `@yourscope/tast-styles` | Cleanest separation; full runtime theming; recommended long-term |

**Recommended: Option 3** — it aligns with the existing semantic token system already in `src/styles/themes/`. Components already use `var(--color-primary)` style vars in most places. This means:

- `@yourscope/tast-styles` ships the SCSS token system (design tokens, mixins, resets)
- Component packages ship zero SCSS, referencing only CSS custom properties
- The app shell imports `@yourscope/tast-styles` once in `main.tsx`

#### 3c — Package structure

```
packages/
├── tast-styles/          ← SCSS token system, resets, mixins
│   ├── src/
│   │   └── (current src/styles/* contents)
│   └── package.json
│
├── tast-utils/           ← formatters, helpers, storage, http service, pwa utils
│   ├── src/
│   │   └── (current src/utils/* + src/services/*)
│   └── package.json
│
├── tast-hooks/           ← useTheme, useLocalStorage, useDocumentTitle
│   ├── src/
│   └── package.json
│
└── tast-ui/              ← Button, ErrorBoundary, ThemeProvider, ProtectedRoute
    ├── src/
    └── package.json
```

#### 3d — Versioning strategy

Use **Changesets** for version management:
```sh
yarn add -D @changesets/cli -W
yarn changeset init
```

Workflow:
```sh
# After making changes to a package:
yarn changeset          # describe what changed + semver bump type
yarn changeset version  # bumps package.json versions
yarn changeset publish  # publishes to GitHub Packages
```

**Deliverable:** `yarn add @yourscope/tast-ui @yourscope/tast-utils` in any app. Components, hooks, and utilities stay versioned. `yarn upgrade` pulls improvements.

---

### Phase 4 — App Shell Template (Consuming the Packages)

**Complexity:** Low (once Phase 3 is done)

Update the template repo's app shell to consume its own packages instead of having the source inline.

#### Before (current):
```
tast-fe-app/src/
├── components/   ← source lives here in the app
├── hooks/
└── utils/
```

#### After:
```
tast-fe-app/src/
├── pages/         ← only app-specific code remains
├── routes/
├── layouts/       ← thin shell wrappers
└── App.tsx        ← imports from @yourscope/tast-ui
```

```ts
// App.tsx — after
import { ErrorBoundary, ThemeProvider } from '@yourscope/tast-ui';
import { AppRouter } from './routes';
```

The app shell template now serves as a **minimal, correct starting point** for consuming the packages. New apps created from it get everything wired correctly.

**Deliverable:** The template repo stays small. All meaningful code lives in packages. When you `gh repo clone --template`, the app pulls all packages as dependencies.

---

### Phase 5 — CLI Scaffolder `create-tast-app`

**Complexity:** Medium | **Value:** Excellent developer experience

A CLI means new apps are created with a single command that handles all setup questions interactively.

```sh
npx @yourscope/create-tast-app my-new-app
```

Output:
```
✔ App name: my-new-app
✔ Enable PWA? Yes
✔ Enable Docker? Yes
✔ Install dependencies? Yes

Creating my-new-app from template...
Installing @yourscope/tast-ui@^2.0.0...
✅  Done! cd my-new-app && yarn dev
```

#### Implementation

The CLI is a small Node script (use `prompts` — already a devDependency in the template):

```
packages/create-tast-app/
├── src/
│   ├── index.ts         ← CLI entry, prompts user
│   ├── scaffold.ts      ← copies template, replaces tokens
│   └── templates/       ← file templates with {{APP_NAME}} tokens
└── package.json
```

The CLI can also run the existing setup scripts (`setup-pwa.js`, `setup-docker.js`) as part of scaffolding.

**Deliverable:** One command from zero to running app, correctly configured, with all packages pre-installed.

---

### Phase 6 — Automated Publishing via GitHub Actions

**Complexity:** Medium | **Value:** Removes all manual publish friction

Publishing should be automatic. With Changesets wired to GitHub Actions:

`.github/workflows/release.yml`:
```yaml
name: Release
on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          registry-url: https://npm.pkg.github.com
      - run: yarn install --frozen-lockfile
      - run: yarn build         # build all packages
      - name: Create Release PR or Publish
        uses: changesets/action@v1
        with:
          publish: yarn changeset publish
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**How this works:**
1. You make changes to a package and run `yarn changeset` to describe the change
2. Push to `main`
3. The action opens a **"Version Packages" PR** that bumps all affected versions
4. When you merge that PR, the action publishes the new versions to GitHub Packages automatically
5. Apps that have Dependabot enabled get an automatic PR to upgrade the package

**Deliverable:** Zero-touch publishing. Fix a bug → push → done. Apps with Dependabot get upgrade PRs automatically.

---

## Summary Roadmap

```
Phase 1  ─── GitHub Template + CI                  ← You can do this today (1–2 hours)
    │
Phase 2  ─── Shareable ESLint/TS/Stylelint configs  ← 1–2 days
    │
Phase 3  ─── tast-ui, tast-utils, tast-hooks pkgs  ← 3–5 days (most effort, most value)
    │
Phase 4  ─── App shell consumes packages            ← 1 day (requires Phase 3)
    │
Phase 5  ─── create-tast-app CLI                   ← 2–3 days (optional but great DX)
    │
Phase 6  ─── Automated publishing (Changesets CI)  ← 1 day
```

**Minimum viable package system:** Phases 1 + 2 + 3 + 6. You can skip 4 and 5 and still get versioned, propagatable updates.

---

## Critical Decisions Before Starting

Answer these before writing any code:

1. **GitHub scope** — Your GitHub username or an org name becomes the npm scope: `@yourscope/tast-ui`. Decide this first; it affects every package name.

2. **Monorepo strategy** — Keep packages in the same repo as the app shell (simpler) or separate repos (cleaner separation, more overhead)?
   - **Recommended:** Same repo, `packages/` subdirectory, using Yarn Workspaces. Lets you develop packages and the template shell side by side.

3. **SCSS strategy** — Option 1 (pre-compiled CSS), 2 (raw SCSS), or 3 (CSS vars only)?
   - **Recommended:** Option 3 (CSS custom properties). The token system already supports this.

4. **Versioning** — All packages at the same version (fixed) or independent versions?
   - **Recommended:** Independent via Changesets. Allows `tast-utils` to be at `3.1.0` while `tast-ui` is at `1.5.2`.

5. **Public vs Private** — GitHub Packages on a personal account requires authentication even for "public" packages. Consider publishing to the public npm registry instead if the packages should be freely accessible.
