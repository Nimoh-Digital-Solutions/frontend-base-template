---
"@nimoh-digital-solutions/tast-styles": minor
---

feat(tast-styles): integrate Open Props CSS custom properties

- Add `open-props` as a dependency
- Document loading strategy in `src/vendors/_index.scss`
- Update `$transitions` map to use `var(--ease-3)` timing function from
  Open Props — consumers loading `open-props/style` globally get smoother
  cubic-bezier easing on all transitions; the map remains overridable via
  `!default` and `map.merge()`.

Consumer apps must load Open Props once at their JS entry point:
  import 'open-props/style'; // in main.tsx
