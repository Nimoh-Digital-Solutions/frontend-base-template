# @nimoh-digital-solutions/stylelint-config

Shared [Stylelint](https://stylelint.io/) configuration for Nimoh Digital Solutions SCSS projects. Extends `stylelint-config-standard` with SCSS-aware rules and stylistic formatting.

[![npm](https://img.shields.io/npm/v/@nimoh-digital-solutions/stylelint-config)](https://www.npmjs.com/package/@nimoh-digital-solutions/stylelint-config)

## Installation

```bash
npm install -D @nimoh-digital-solutions/stylelint-config
# or
yarn add -D @nimoh-digital-solutions/stylelint-config
```

### Peer dependencies

```bash
npm install -D stylelint
```

| Package | Version |
|---|---|
| `stylelint` | `>=16` |

Runtime dependencies (`@stylistic/stylelint-plugin`, `postcss-scss`, `stylelint-config-standard`, `stylelint-scss`) are bundled automatically.

## Usage

Add to your `.stylelintrc.json` (or `stylelint.config.js`):

```json
{
  "extends": "@nimoh-digital-solutions/stylelint-config"
}
```

Or in `package.json`:

```json
{
  "stylelint": {
    "extends": "@nimoh-digital-solutions/stylelint-config"
  }
}
```

## What's included

### Base

- Extends [stylelint-config-standard](https://github.com/stylelint/stylelint-config-standard)
- Custom syntax: `postcss-scss` (enables SCSS parsing)

### Plugins

| Plugin | Purpose |
|---|---|
| `stylelint-scss` | SCSS-specific linting (`@use`, `@include`, nesting, etc.) |
| `@stylistic/stylelint-plugin` | Formatting rules (indentation, spacing) |

### Key rules

- **`scss/at-rule-no-unknown`** replaces the standard `at-rule-no-unknown` (allows SCSS directives like `@use`, `@include`, `@mixin`)
- Relaxed pattern/notation rules for SCSS compatibility
- Consistent formatting via `@stylistic` plugin

### Ignored paths

`dist/**`, `node_modules/**`, `coverage/**`

## Customization

Override any rule in your project config:

```json
{
  "extends": "@nimoh-digital-solutions/stylelint-config",
  "rules": {
    "selector-class-pattern": null,
    "scss/no-global-function-names": null
  }
}
```

## Running Stylelint

```bash
# Lint all SCSS files
npx stylelint "src/**/*.scss"

# Autofix
npx stylelint "src/**/*.scss" --fix
```

## Development

This package lives in the [TAST monorepo](https://github.com/Nimoh-Digital-Solutions/frontend-base-template).

## License

MIT
