# @nimoh-digital-solutions/eslint-config

Shared [ESLint flat config](https://eslint.org/docs/latest/use/configure/configuration-files-new) for Nimoh Digital Solutions React + TypeScript projects. Includes TypeScript strict rules, React best practices, JSX accessibility, and opinionated import sorting.

[![npm](https://img.shields.io/npm/v/@nimoh-digital-solutions/eslint-config)](https://www.npmjs.com/package/@nimoh-digital-solutions/eslint-config)

## Installation

```bash
npm install -D @nimoh-digital-solutions/eslint-config
# or
yarn add -D @nimoh-digital-solutions/eslint-config
```

### Peer dependencies

Install all required peer dependencies:

```bash
npm install -D eslint @eslint/js @typescript-eslint/eslint-plugin @typescript-eslint/parser \
  eslint-plugin-jsx-a11y eslint-plugin-react eslint-plugin-react-hooks \
  eslint-plugin-react-refresh eslint-plugin-simple-import-sort globals
```

| Package | Version |
|---|---|
| `eslint` | `>=8` |
| `@eslint/js` | `>=8` |
| `@typescript-eslint/eslint-plugin` | `^8` |
| `@typescript-eslint/parser` | `^8` |
| `eslint-plugin-jsx-a11y` | `^6` |
| `eslint-plugin-react` | `^7` |
| `eslint-plugin-react-hooks` | `^5` |
| `eslint-plugin-react-refresh` | `^0.4` |
| `eslint-plugin-simple-import-sort` | `^12` |
| `globals` | `>=15` |

## Usage

Create an `eslint.config.js` (or `.mjs`) in your project root:

```js
import sharedConfig from '@nimoh-digital-solutions/eslint-config';

export default [
  ...sharedConfig,
  // your project overrides
];
```

That's it. The config is a flat config array that you spread into your own.

## What's included

### Language & parser

- **TypeScript parser** for all `.ts`, `.tsx`, `.js`, `.jsx` files
- **ES2022** source type, browser globals

### Plugins

| Plugin | Purpose |
|---|---|
| `@typescript-eslint` | TypeScript-aware rules |
| `eslint-plugin-react` | React best practices (JSX runtime mode) |
| `eslint-plugin-react-hooks` | Rules of hooks |
| `eslint-plugin-react-refresh` | Fast Refresh boundary checks |
| `eslint-plugin-jsx-a11y` | Accessibility (recommended) |
| `eslint-plugin-simple-import-sort` | Deterministic import/export ordering |

### Import sort order

Imports are automatically grouped:

1. React
2. External packages
3. Internal aliases (`@/…`)
4. Relative imports
5. Style imports (`.scss`, `.css`)

### Key rules

| Rule | Severity | Notes |
|---|---|---|
| `@typescript-eslint/no-explicit-any` | error | No `any` |
| `@typescript-eslint/no-floating-promises` | error | Must `await` or `void` promises |
| `prefer-const` | error | Use `const` over `let` when possible |
| `no-console` | warn | Only in `src/` — allows `warn`, `error`, `info` |
| React hooks rules | error | Enforced |
| JSX a11y | recommended | Full recommended set |

### Ignored paths

`dist`, `node_modules`, `coverage`, `e2e`, `playwright-report`, `test-results`

## Customization

Override any rule in your project config:

```js
import sharedConfig from '@nimoh-digital-solutions/eslint-config';

export default [
  ...sharedConfig,
  {
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
];
```

## Development

This package lives in the [TAST monorepo](https://github.com/Nimoh-Digital-Solutions/frontend-base-template).

## License

MIT
