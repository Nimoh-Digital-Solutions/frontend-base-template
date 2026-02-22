# Using TAST for New Frontend Applications

Everything you need to go from zero to a running, production-ready React app.

---

## Prerequisites

| Tool | Minimum | Notes |
|---|---|---|
| Node.js | 22 | Use nvm: `nvm use 22` |
| Yarn | 1.22 | `npm install -g yarn` |
| Git | Any | — |
| GitHub account | — | Needed to pull private packages |

---

## 1. Authentication (one-time per machine)

All packages are published to **GitHub Packages**. You need to authenticate before installing.

**1a. Create a classic PAT:**
- github.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
- Scope: ✅ `read:packages`
- Copy the token (`ghp_...`)

**1b. Add to your global `.npmrc`:**
```bash
echo "//npm.pkg.github.com/:_authToken=ghp_YOUR_TOKEN_HERE" >> ~/.npmrc
```

> This is a one-time setup per machine. You will not need to repeat it for each new project.

---

## 2. Create a New App

### Option A — CLI (recommended)
```bash
npx @nimoh-digital-solutions/create-tast-app my-app
```

You'll be prompted:
```
✔ App name: my-app
✔ Short description:
✔ Enable PWA support?   › Yes / No
✔ Enable Docker?        › Yes / No
✔ Enable Husky?         › Yes / No
✔ Package manager:      › yarn / npm / pnpm
✔ Install dependencies? › Yes / No
```

The CLI will:
- Clone the template repo
- Rename the package, update `index.html` title, `appConfig.ts`, README, and PWA manifest
- Remove any features you opted out of
- Run install if you chose yes

### Option B — GitHub Template
1. Go to [Nimoh-Digital-Solutions/frontend-base-template](https://github.com/Nimoh-Digital-Solutions/frontend-base-template)
2. Click **"Use this template"** → **"Create a new repository"**
3. Clone your new repo and run `yarn install`
4. (Optional) Run `yarn setup` to interactively remove features you don't need

---

## 3. First-time Project Setup

After the project is created:

```bash
cd my-app

# 1. Copy the environment file
cp .env.example .env.local

# 2. Edit .env.local with your values
# VITE_API_URL=https://your-api.com
# VITE_APP_TITLE=My App

# 3. Start the dev server
yarn dev
```

App will be available at `http://localhost:5173`.

---

## 4. Project Structure — Where Things Go

```
src/
├── components/
│   ├── common/      ← Shared functional components (ErrorBoundary, ProtectedRoute)
│   ├── ui/          ← Shared visual components (Button, etc.)
│   └── layout/      ← Header, Footer — chrome that wraps every page
├── features/        ← Feature slices (see src/features/README.md)
├── pages/           ← Route-level components (one folder per page)
├── hooks/           ← App-specific custom hooks
├── services/        ← API client instances (http.ts is the base)
├── contexts/        ← React context providers
├── types/           ← Shared TypeScript types
├── utils/           ← Utility functions (re-exports from tast-utils)
├── styles/          ← Global SCSS (tokens, resets, themes)
└── routes/
    ├── config/paths.ts          ← Add new PATHS constants here
    └── config/routesConfig.tsx  ← Add new routes here
```

---

## 5. Adding a New Page

**1. Create the page component:**
```
src/pages/DashboardPage/
├── DashboardPage.tsx
├── DashboardPage.module.scss
└── index.ts
```

**2. Register the path (`src/routes/config/paths.ts`):**
```ts
export const PATHS = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  // ...
} as const;
```

**3. Add the route (`src/routes/config/routesConfig.tsx`):**
```tsx
const DashboardPage = lazy(() => import('@pages/DashboardPage/DashboardPage'));

// Inside AppLayout children:
{
  path: PATHS.DASHBOARD,
  element: (
    <Suspense fallback={<PageFallback />}>
      <DashboardPage />
    </Suspense>
  ),
},
```

---

## 6. Adding a New Feature (Feature Slice)

Use the `src/features/` directory for self-contained features (e.g. auth, billing, user-profile).

```
src/features/
└── auth/
    ├── components/
    │   └── LoginForm/
    ├── hooks/
    │   └── useAuthSession.ts
    ├── services/
    │   └── authService.ts
    ├── contexts/
    │   └── AuthContext.tsx
    ├── types/
    │   └── auth.types.ts
    └── index.ts           ← Public API of the feature
```

Import from the feature's public API barrel only. Do not import feature internals from outside the slice.

---

## 7. Making API Calls

A typed HTTP client is pre-configured with your `VITE_API_URL`:

```ts
// src/services/http.ts — already set up, just import it
import { http } from '@services';

// Feature service example
import type { ApiResponse } from '@types';

export async function getUser(id: string): Promise<ApiResponse<User>> {
  return http.get<User>(`/users/${id}`);
}
```

**Handling errors:**
```ts
import { HttpError } from '@services';

try {
  const user = await getUser('123');
} catch (err) {
  if (err instanceof HttpError) {
    console.error(err.status, err.message);
  }
}
```

---

## 8. Auth / Protected Routes

Use `ProtectedRoute` from `@components`:

```tsx
import { ProtectedRoute } from '@components';

// In routesConfig.tsx
{
  path: PATHS.DASHBOARD,
  element: (
    <ProtectedRoute isAuthenticated={isLoggedIn} redirectTo={PATHS.LOGIN}>
      <Suspense fallback={<PageFallback />}>
        <DashboardPage />
      </Suspense>
    </ProtectedRoute>
  ),
}
```

---

## 9. Theming

Light/dark is already wired up via CSS custom properties.

```ts
import { useTheme } from '@hooks';

const { theme, toggleTheme } = useTheme();
// theme: 'light' | 'dark'
```

**Using tokens in your SCSS:**
```scss
.card {
  background: var(--color-surface);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  padding: var(--spacing-4);
  font-size: var(--font-size-base);
}
```

All tokens are defined in `src/styles/themes/_base.scss` (light) and `_dark.scss` (dark).

---

## 10. Writing Tests

Tests live alongside the code they test:

```
src/components/ui/Button/
├── Button.tsx
├── Button.test.tsx   ← Tests here
└── index.ts
```

**Component test example:**
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

it('calls onClick when clicked', async () => {
  const handleClick = vi.fn();
  render(<Button onClick={handleClick}>Click me</Button>);
  
  await userEvent.click(screen.getByRole('button'));
  
  expect(handleClick).toHaveBeenCalledOnce();
});
```

```bash
yarn test          # watch mode
yarn test:run      # single run
yarn test:coverage # coverage report
```

---

## 11. Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `VITE_API_URL` | Yes | Base URL for API requests |
| `VITE_APP_TITLE` | No | App display name (default: `React Starter Kit`) |
| `VITE_PWA` | No | Set `true` to enable PWA service worker in dev |
| `DOCKER` | No | Auto-set by `docker-compose.yml` |

Always use `VITE_` prefix for variables you want available in the browser bundle. Variables without it are only available in Node (e.g. `vite.config.ts`).

---

## 12. Docker Deployment

```bash
# Development
docker-compose up

# Production build
docker build -t my-app .
docker run -p 80:80 my-app
```

The Nginx config in `nginx.conf` handles:
- SPA routing (all routes serve `index.html`)
- Gzip compression
- Cache headers for assets
- Security headers

---

## 13. Removing Optional Features

Each feature can be permanently removed using its setup script. This removes all related files, dependencies, and configuration:

```bash
yarn setup:pwa      # Remove PWA / service worker
yarn setup:docker   # Remove Docker + Nginx
yarn setup:husky    # Remove git hooks + lint-staged
yarn setup:testing  # Remove Vitest + testing dependencies
yarn setup          # Interactive — remove any combination
```

These scripts are destructive and self-delete after running. Run them before committing.

---

## 14. Code Quality Checks

```bash
# Run everything (slow — use before pushing)
yarn check

# Individual checks
yarn type-check      # TypeScript
yarn lint            # ESLint
yarn stylelint       # SCSS linting
yarn test:run        # Tests

# Auto-fix everything possible
yarn check:fix
```

Pre-commit hooks run ESLint + Prettier + Stylelint automatically on staged files. Commit messages must follow Conventional Commits (`feat:`, `fix:`, `chore:`, etc.).

---

## 15. Consuming Updated Packages

When a package is updated and published, update your app:

**If using Yarn workspaces (this repo):** run `yarn install` — workspace symlinks always resolve to latest local source.

**If in a separate app:** bump the version in `package.json` and install:
```bash
yarn upgrade @nimoh-digital-solutions/tast-ui@latest
```

Or if you have Dependabot enabled on the consuming repo, it will open a PR automatically when a new version is published.

---

## 16. Publishing Package Updates

When you make changes to a package in this repo:

```bash
# 1. Describe the change
yarn changeset
# → interactive: pick which package(s) changed, describe bump (patch/minor/major)

# 2. Commit the changeset file alongside your code
git add .
git commit -m "fix: correct button focus ring color"
git push
```

GitHub Actions will then:
1. Detect the pending changeset and open a **"Version Packages"** PR
2. When you merge that PR → automatically publish the updated packages to GitHub Packages

---

## Quick Reference

```bash
# New app
npx @nimoh-digital-solutions/create-tast-app my-app

# Daily development
yarn dev
yarn test
yarn lint

# Before pushing
yarn check

# Release a package fix
yarn changeset && git commit && git push
```
