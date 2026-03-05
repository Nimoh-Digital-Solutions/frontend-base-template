---
"@nimoh-digital-solutions/tast-ui": minor
---

Add animated split-panel auth flow and branded PageLoader component.

All three auth views (login, register, forgot-password) now share a single `AuthPage` with directional slide transitions driven by `motion/react`. The branding panel swaps content per view (LogIn, UserPlus, LockKeyhole icons), the forgot-password route is nested under `AuthPage` rather than being a standalone page, and the "Forgot password?" link in `LoginForm` triggers an in-place view change instead of a hard navigation.

A new `PageLoader` component replaces the bare "Loading…" text shown during auth bootstrap and lazy-route code-splitting. It renders a full-viewport centred screen matching the auth visual language — warm off-white background, brand logo mark, and an animated spinner in brand purple.

React Router v7 leaf-route warning silenced — auth child routes now carry `element: null` and all `Suspense` fallbacks use `<PageLoader />` (orphaned `pageFallback.module.scss` removed).

Auth bootstrap fix: `useInitAuth` no longer calls `POST /auth/token/refresh/` unconditionally on every page load. A non-sensitive `tast:sessionActive` flag is written to `localStorage` on login (`setAuth`) and cleared on logout (`clearAuth`). The bootstrap hook skips the refresh call entirely when the flag is absent, eliminating the spurious 500 error on the login page for unauthenticated users.
