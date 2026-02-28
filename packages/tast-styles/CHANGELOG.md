# @nimoh-digital-solutions/tast-styles

## 1.1.2

### Patch Changes

- d7e3f4d: docs: add comprehensive README documentation for all packages

## 1.1.1

### Patch Changes

- 27506fa: feat(tast-styles): add animation keyframes and layout mixins
  - New `_animations.scss` partial with reusable keyframe definitions
  - Extended `_mixins.scss` with additional layout and responsive helpers

## 1.1.0

### Minor Changes

- f65cf08: feat(tast-styles): integrate Open Props CSS custom properties
  - Add `open-props` as a dependency
  - Document loading strategy in `src/vendors/_index.scss`
  - Update `$transitions` map to use `var(--ease-3)` timing function from
    Open Props — consumers loading `open-props/style` globally get smoother
    cubic-bezier easing on all transitions; the map remains overridable via
    `!default` and `map.merge()`.

  Consumer apps must load Open Props once at their JS entry point:
  import 'open-props/style'; // in main.tsx
