import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      include: ['src'],
    }),
  ],
  resolve: {
    alias: {
      // Map @styles → tast-styles source so SCSS modules resolve at build time
      '@styles': path.resolve(__dirname, '../tast-styles/src'),
    },
  },
  css: {
    modules: {
      // Generates short, deterministic class names: Button_root__abc123
      generateScopedName: '[name]_[local]__[hash:base64:6]',
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react-router-dom',
        'clsx',
        'react-icons',
        'react-icons/pi',
        '@nimoh-digital-solutions/tast-utils',
      ],
    },
    // Emit CSS bundle (dist/style.css)
    cssCodeSplit: false,
  },
});
