---
"@nimoh-digital-solutions/create-tast-app": minor
---

Add animated split-panel auth layout with Framer Motion panel-swap animation.

New auth components integrated into the scaffolded template:
- `AuthSplitPanel` — full-viewport two-panel layout with `motion.div layout` spring animation that swaps the branding/form panels when switching between login and register
- `AuthBranding` — animated branding panel with logo, headline, tagline, and social proof; content animates via `AnimatePresence` when mode changes
- `AuthPage` — persistent single-component layout route for `/login` and `/register` that keeps `AuthSplitPanel` mounted across route transitions, enabling the panel-swap animation
- `BackgroundPaths` — animated SVG path overlay on the dark panel
- `ForgotPasswordForm` / `ForgotPasswordPage` — dedicated forgot-password screen with success state animation
- `AuthRoutesWrapper` — layout route that redirects authenticated users to home
- Design tokens in `_auth-tokens.scss` for consistent auth-screen theming

Accessibility: `<main>` landmark, `<h1>` heading on every auth page, reduced-motion support throughout.
