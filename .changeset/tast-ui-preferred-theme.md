---
'@nimoh-digital-solutions/tast-ui': patch
---

feat(ThemeContext): add `preferredTheme` + `setPreferredTheme` to ThemeProvider

- New `app-theme-preferred` localStorage key stores the user's explicit default theme
- On init and OS dark-mode change events, a stored preference of `dim` overrides the OS dark → `dark` fallback, initialising as `dim` instead
- `ThemeContextValue` now exposes `preferredTheme: Theme | null` and `setPreferredTheme(theme: Theme | null): void`
- Setting `preferredTheme` to `null` clears the persisted preference
