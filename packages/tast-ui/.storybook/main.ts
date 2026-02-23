import type { StorybookConfig } from '@storybook/react-vite';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],

  addons: [
    '@storybook/addon-a11y',
  ],

  framework: {
    name: '@storybook/react-vite',
    options: {},
  },

  /**
   * Extend the Vite config that Storybook uses to serve stories so it matches
   * the production build config:
   *  - @styles alias resolves to tast-styles source
   *  - postcss-jit-props injects only the Open Props vars that are referenced
   *    (needed for var(--ease-3) etc. that SCSS produces via func.transition())
   */
  async viteFinal(config) {
    const { mergeConfig } = await import('vite');
    const postcssJitProps = (await import('postcss-jit-props')).default;
    const OpenProps = (await import('open-props')).default;

    return mergeConfig(config, {
      resolve: {
        alias: {
          '@styles': path.resolve(__dirname, '../../tast-styles/src'),
        },
      },
      css: {
        postcss: {
          plugins: [postcssJitProps(OpenProps)],
        },
      },
    });
  },
};

export default config;
