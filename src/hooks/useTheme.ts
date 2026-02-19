import { useThemeContext } from '@contexts/ThemeContext';
import type { Theme } from '@types';

export interface UseThemeReturn {
  /** Current active theme */
  theme: Theme;
  /** Toggle between 'light' and 'dark' */
  toggleTheme: () => void;
  /** Set a specific theme */
  setTheme: (theme: Theme) => void;
  /** Convenience flag — true when theme === 'dark' */
  isDark: boolean;
  /** Convenience flag — true when theme === 'light' */
  isLight: boolean;
}

/**
 * useTheme — read and control the active theme.
 *
 * Must be used inside a component tree wrapped with `<ThemeProvider>`.
 *
 * @example
 * const { theme, toggleTheme, isDark } = useTheme();
 */
export const useTheme = (): UseThemeReturn => {
  const { theme, toggleTheme, setTheme } = useThemeContext();
  return {
    theme,
    toggleTheme,
    setTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
  };
};
