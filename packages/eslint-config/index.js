import js from '@eslint/js';
import globals from 'globals';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';

/**
 * @nimoh-digital-solutions/eslint-config
 *
 * Shared ESLint flat config. Spread into your own eslint.config.js and add
 * any app-specific rules after:
 *
 * @example
 * import sharedConfig from '@nimoh-digital-solutions/eslint-config';
 * export default [
 *   ...sharedConfig,
 *   { files: ['src/my-special/**'], rules: { ... } },
 * ];
 */
const config = [
  // Ignore build outputs
  { ignores: ['dist', 'node_modules', 'coverage'] },

  // -------------------------------------------------------------------------
  // All TS/JS/TSX/JSX files
  // -------------------------------------------------------------------------
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: tsparser,
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // JavaScript / TypeScript
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-redeclare': 'off', // Allow function overloads
      'no-redeclare': 'off', // TypeScript handles this
      'no-undef': 'off', // TypeScript's type checker handles undefined globals

      // React
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      'react-refresh/only-export-components': 'off',

      // Accessibility
      ...jsxA11y.configs.recommended.rules,

      // General
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },

  // -------------------------------------------------------------------------
  // Stricter rules for src source files only
  // -------------------------------------------------------------------------
  {
    files: ['src/**/*.{ts,tsx,js,jsx}'],
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    },
  },

  // -------------------------------------------------------------------------
  // Relaxed rules for scripts and config files
  // -------------------------------------------------------------------------
  {
    files: ['scripts/**/*.js', '*.config.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
];

export default config;
