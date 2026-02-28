# @nimoh-digital-solutions/tsconfig

Shared TypeScript configurations for Nimoh Digital Solutions projects. Provides strict, modern defaults so every project starts with the same baseline.

[![npm](https://img.shields.io/npm/v/@nimoh-digital-solutions/tsconfig)](https://www.npmjs.com/package/@nimoh-digital-solutions/tsconfig)

## Installation

```bash
npm install -D @nimoh-digital-solutions/tsconfig
# or
yarn add -D @nimoh-digital-solutions/tsconfig
```

## Configs

### `react.json` — React + Vite projects (recommended)

Extends `base.json` with JSX and DOM library support.

```json
{
  "extends": "@nimoh-digital-solutions/tsconfig/react.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

### `base.json` — Framework-agnostic baseline

Strict TypeScript config for any modern project.

```json
{
  "extends": "@nimoh-digital-solutions/tsconfig/base.json",
  "include": ["src"]
}
```

## What's included

### `base.json`

| Setting | Value | Why |
|---|---|---|
| `target` | `ES2020` | Modern baseline; all major browsers support it |
| `module` | `ESNext` | Tree-shakeable ES modules |
| `moduleResolution` | `bundler` | Works with Vite, webpack, esbuild, etc. |
| `strict` | `true` | All strict checks enabled |
| `noUncheckedIndexedAccess` | `true` | Indexing arrays/records returns `T \| undefined` |
| `noImplicitReturns` | `true` | Every code path must return |
| `exactOptionalPropertyTypes` | `true` | Distinguishes `undefined` from optional |
| `noEmit` | `true` | Bundler handles emit; tsc is type-check only |
| `isolatedModules` | `true` | Required for SWC/esbuild transpilation |
| `skipLibCheck` | `true` | Faster type checks; trusts `.d.ts` files |
| `resolveJsonModule` | `true` | Import `.json` files |
| `esModuleInterop` | `true` | CJS/ESM interop |

### `react.json`

Everything in `base.json`, plus:

| Setting | Value |
|---|---|
| `jsx` | `react-jsx` |
| `lib` | `["DOM", "DOM.Iterable", "ES2020"]` |

## Overriding options

Add any overrides in the consuming project's `tsconfig.json`:

```json
{
  "extends": "@nimoh-digital-solutions/tsconfig/react.json",
  "compilerOptions": {
    "target": "ES2022",
    "noUncheckedIndexedAccess": false
  }
}
```

## Development

This package lives in the [TAST monorepo](https://github.com/Nimoh-Digital-Solutions/frontend-base-template).

## License

MIT
