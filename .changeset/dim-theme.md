---
"@nimoh-digital-solutions/tast-utils": minor
"@nimoh-digital-solutions/tast-ui": minor
---

feat: add 'dim' theme to Theme type and 3-way toggle cycle

- tast-utils: Theme type extended to 'light' | 'dark' | 'dim'
- tast-ui: ThemeContext toggleTheme cycles light → dim → dark → light
  instead of the previous binary light ↔ dark toggle
