import type { Preview, Decorator } from '@storybook/react';
import { useEffect } from 'react';

// Base design tokens, theme CSS custom properties, and reset styles.
// Using a relative path because the @styles alias is a Vite resolve alias
// and may not be resolved at the module-graph level by node.
import '../../tast-styles/src/index.scss';

/**
 * Apply the selected theme to the document root so that all
 * CSS custom properties (--color-primary, etc.) respond correctly.
 */
const withTheme: Decorator = (Story, context) => {
  const theme = (context.globals['theme'] as string) ?? 'light';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return <Story />;
};

/**
 * Wrap every story in a container with a bit of padding so components
 * don't sit flush against the Storybook canvas edge.
 */
const withPadding: Decorator = (Story) => (
  <div style={{ padding: '2rem', background: 'var(--color-bg-body, #fff)', minHeight: '100%' }}>
    <Story />
  </div>
);

const preview: Preview = {
  decorators: [withTheme, withPadding],

  globalTypes: {
    theme: {
      description: 'Design system theme',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dim',   title: 'Dim' },
          { value: 'dark',  title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },

  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      // Background switching is handled by the theme decorator via CSS vars,
      // so we disable the Storybook backgrounds addon.
      disable: true,
    },
    layout: 'fullscreen',
  },
};

export default preview;
