---
"@nimoh-digital-solutions/tast-ui": minor
---

Add animated split-panel auth flow for login, register, and forgot-password pages.

All three auth views now share a single `AuthPage` with directional slide transitions driven by `motion/react`. The branding panel swaps content per view (LogIn, UserPlus, LockKeyhole icons), the forgot-password route is nested under `AuthPage` rather than being a standalone page, and the "Forgot password?" link in `LoginForm` triggers an in-place view change instead of a hard navigation.
