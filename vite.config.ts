import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import checker from 'vite-plugin-checker';
import { visualizer } from 'rollup-plugin-visualizer';
import autoprefixer from 'autoprefixer';
import pxtorem from 'postcss-pxtorem';
import postcssJitProps from 'postcss-jit-props';
import OpenProps from 'open-props';

import { pwaPlugin, htmlTransformPlugin } from './plugins';

export default defineConfig(({ mode }) => {
  // Loads .env, .env.local, .env.[mode], .env.[mode].local and returns VITE_* vars.
  // Using 'VITE_' prefix (not '') to avoid loading unrelated process env vars
  // (e.g. CI secrets, SSH keys) into the build config object.
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  const isProd = mode === 'production';
  const isTest = mode === 'test' || process.env['VITEST'] === 'true';
  // DOCKER is not a VITE_ var — read it directly from process.env
  const isDocker = process.env['DOCKER'] === 'true'; // Automatically set in docker-compose.

  /**
   * PWA strategy:
   * - Production: always enabled (when PWA feature is installed)
   * - Development: opt-in to avoid service worker stale-cache issues
   *
   * Enable dev PWA with:
   *   VITE_PWA=true yarn dev
   */
  const enableDevPwa = env.VITE_PWA === 'true';

  return {
    plugins: [
      react(),
      // PWA always enabled in prod, opt-in in dev
      pwaPlugin({ isProd, enableDev: enableDevPwa }),
      // Remove PWA manifest link when disabled in dev
      htmlTransformPlugin(isProd || enableDevPwa),
      svgr(),
      checker({
        enableBuild: false,
        overlay: { initialIsOpen: false },
        // Stylelint checker disabled during tests — no vite dev server needed for vitest
        stylelint: isTest ? false : {
          lintCommand: 'stylelint "./src/**/*.scss"',
        },
        typescript: true,
      }),
      // Bundle visualiser — only active in 'analyze' mode (yarn build:analyze)
      // Generates dist/stats.html — open it to inspect chunk sizes.
      ...(mode === 'analyze'
        ? [visualizer({ open: true, filename: 'dist/stats.html', gzipSize: true, brotliSize: true })]
        : []),
    ],

    resolve: {
      alias: {
        '@assets': path.resolve(__dirname, 'src/assets'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@configs': path.resolve(__dirname, 'src/configs'),
        '@contexts': path.resolve(__dirname, 'src/contexts'),
        '@data': path.resolve(__dirname, 'src/data'),
        '@hooks': path.resolve(__dirname, 'src/hooks'),
        '@layouts': path.resolve(__dirname, 'src/layouts'),
        '@pages': path.resolve(__dirname, 'src/pages'),
        '@routes': path.resolve(__dirname, 'src/routes'),
        '@styles': path.resolve(__dirname, 'src/styles'),
        '@types': path.resolve(__dirname, 'src/types'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@services': path.resolve(__dirname, 'src/services'),
        '@features': path.resolve(__dirname, 'src/features'),
      },
    },

    css: {
      postcss: {
        plugins: [          // Injects only the Open Props custom properties that are actually
          // referenced via var(--...) in CSS/SCSS — keeps bundle lean.
          postcssJitProps(OpenProps),          autoprefixer(),
          pxtorem({
            rootValue: 16,
            mediaQuery: true,
            // Exclude properties where sub-pixel precision is meaningful
            // (borders, shadows, outlines). '!border*' etc. uses postcss-pxtorem's
            // negation prefix to keep those values in px.
            propList: ['*', '!border*', '!box-shadow', '!outline*', '!column-rule*'],
          }),
        ],
      },
      preprocessorOptions: {
        scss: {
          additionalData: '', // Global SCSS if needed
        },
      },
    },

    server: {
      // Docker-friendly: bind to all interfaces so the host can reach Vite
      host: true,
      port: 3000,

      // Don't try to open a browser when running in Docker
      open: !isDocker,
    },

    build: {
      outDir: 'dist',
      minify: true,
      // 'hidden' keeps source maps out of the CDN-served bundle but available
      // for error symbolication in Sentry / Datadog.  Upload dist/*.map files
      // to your error tracker after each production deploy.
      sourcemap: 'hidden',
      // Split vendor libs into a separate chunk so they can be cached
      // independently of app code — a new deploy only invalidates app chunks.
      rollupOptions: {
        output: {
          // Use a function so every react-icons sub-package (e.g. react-icons/lu)
          // is grouped into the same chunk, independently cached from app code.
          manualChunks(id) {
            if (id.includes('react-icons')) return 'icons';
            if (id.includes('react-dom') || id.includes('react/')) return 'vendor';
            if (id.includes('react-router')) return 'router';
          },
        },
      },
    },

    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      css: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'src/test/',
          '**/*.d.ts',
          '**/*.config.*',
          '**/mockData',
          'dist/',
        ],
      },
      include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      exclude: ['node_modules', 'dist'],
    },
  };
});
