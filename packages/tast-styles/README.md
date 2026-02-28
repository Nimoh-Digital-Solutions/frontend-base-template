# @nimoh-digital-solutions/tast-styles

SCSS design tokens, mixins, functions, and base styles for the TAST design system. Built on top of [Open Props](https://open-props.style/) for high-quality defaults.

[![npm](https://img.shields.io/npm/v/@nimoh-digital-solutions/tast-styles)](https://www.npmjs.com/package/@nimoh-digital-solutions/tast-styles)

## Installation

```bash
npm install @nimoh-digital-solutions/tast-styles
# or
yarn add @nimoh-digital-solutions/tast-styles
```

### Dependencies

| Package | Version | Purpose |
|---|---|---|
| `open-props` | `^1.7` | CSS custom property design tokens |

## Usage

```scss
// Import everything
@use '@nimoh-digital-solutions/tast-styles' as *;

// Or import specific layers
@use '@nimoh-digital-solutions/tast-styles/abstracts/variables' as *;
@use '@nimoh-digital-solutions/tast-styles/abstracts/mixins' as *;
@use '@nimoh-digital-solutions/tast-styles/abstracts/functions' as *;
@use '@nimoh-digital-solutions/tast-styles/themes/base';
@use '@nimoh-digital-solutions/tast-styles/themes/dark';
```

## Architecture

```
src/
├── abstracts/        Design tokens & helpers
│   ├── _variables    Token maps (colors, spacing, typography, etc.)
│   ├── _functions    Getter functions — color(), spacing(), font-size(), etc.
│   ├── _mixins       Layout & utility mixins
│   ├── _utils        Internal helpers
│   └── _animations   Keyframe definitions
├── base/             CSS reset
├── themes/           Light & dark theme CSS custom properties
├── layout/           Layout patterns
├── pages/            Page-level styles
└── vendors/          Third-party overrides
```

## Design tokens

### Colors

60+ palette entries organized by hue, plus semantic tokens via CSS custom properties:

```scss
// Direct palette access
$color: color('blue-500');
$bg: color('surface-primary');
$text: color('text-primary');
$accent: color('accent-primary');
$error: color('error');
$success: color('success');
```

### Spacing

40+ rem-based spacing values from `0` to `96`:

```scss
$gap: spacing('4');   // 1rem
$pad: spacing('8');   // 2rem
$margin: spacing('16'); // 4rem
```

### Typography

```scss
$family: font-family('sans');
$size: font-size('lg');       // 13 sizes: xs → 9xl
$weight: font-weight('bold'); // 6 weights: thin → black
```

### Breakpoints

| Token | Value |
|---|---|
| `xs-mobile` | 480px |
| `sm-tablet` | 640px |
| `md-tablet` | 768px |
| `lg-desktop` | 1024px |
| `xl-desktop` | 1400px |

### Other tokens

| Category | Function | Values |
|---|---|---|
| Shadows | `shadow('md')` | `sm`, `md`, `lg`, `xl`, `text` |
| Border radius | `border-radius('lg')` | `none`, `sm`, `md`, `lg`, `xl`, `2xl`, `round`, `pill` |
| Transitions | `transition('normal')` | `fast` (0.2s), `normal` (0.3s), `slow` (0.5s) |
| Z-index | `z-index('modal')` | `dropdown` (1000) → `tooltip` (1070) |

## Functions

Getter functions provide type-safe access to token maps:

```scss
// All return the mapped value or throw on unknown keys
color($key)
spacing($key)
font-size($key)
font-weight($key)
font-family($key)
breakpoint($key)
shadow($key)
border-radius($key)
transition($key)
z-index($key)

// Color manipulation
tint($color, $percentage)   // Mix with white
shade($color, $percentage)  // Mix with black
```

## Mixins

### Responsive

```scss
// Min-width breakpoint
@include bp-min('md-tablet') {
  .sidebar { display: block; }
}

// Max-width breakpoint
@include bp-max('sm-tablet') {
  .sidebar { display: none; }
}
```

### Accessibility

```scss
.sr-only {
  @include visually-hidden;
}

.focusable {
  @include focus-ring(2px);  // Offset parameter
}

// Respect user motion preferences
@include reduce-motion {
  animation: none;
}

@include motion-safe {
  animation: fade-in 0.3s ease;
}
```

### Layout

```scss
.page {
  @include full-page-flex-col;  // Full-height flex column
}

.card {
  @include card-block;  // Standard card surface pattern
}

.grid {
  @include auto-grid(250px);  // CSS Grid with auto-fill, min column width
}
```

### Utilities

```scss
button {
  @include bare-button;      // Reset button styles
}

ul {
  @include bare-list;        // Reset list styles
}

.scrollable {
  @include styled-scrollbar; // Custom scrollbar styling
}

body {
  @include font-smoothing;   // Antialiased text rendering
}
```

## Theme system

The package ships light and dark themes as CSS custom properties:

```scss
// base theme (light) — sets :root variables
@use '@nimoh-digital-solutions/tast-styles/themes/base';

// dark theme — overrides under [data-theme="dark"]
@use '@nimoh-digital-solutions/tast-styles/themes/dark';
```

Toggle themes by setting the `data-theme` attribute on `<html>`:

```js
document.documentElement.setAttribute('data-theme', 'dark');
```

## Animations

Pre-built keyframes that respect `prefers-reduced-motion`:

```scss
@use '@nimoh-digital-solutions/tast-styles/abstracts/animations';

.element {
  animation: fade-in 0.3s ease;
  // Also available: bounce, spin, fade-out
}
```

## Overriding tokens

All token maps use `!default`, so you can override them before importing:

```scss
@use '@nimoh-digital-solutions/tast-styles/abstracts/variables' with (
  $colors: map-merge($colors, ('brand': #ff6600))
);
```

## Development

This package lives in the [TAST monorepo](https://github.com/Nimoh-Digital-Solutions/frontend-base-template).

```bash
yarn packages:build   # Build all packages
```

## License

MIT
