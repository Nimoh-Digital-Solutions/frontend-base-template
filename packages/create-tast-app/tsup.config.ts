import { defineConfig } from 'tsup';
import { readFileSync } from 'fs';

const { version: pkgVersion } = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf-8')
) as { version: string };

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  target: 'node18',
  outExtension: () => ({ js: '.cjs' }),
  banner: {
    js: '#!/usr/bin/env node',
  },
  clean: true,
  shims: true,
  noExternal: ['prompts'],
  define: {
    __PACKAGE_VERSION__: JSON.stringify(pkgVersion),
  },
});
