import { createContext, useCallback, useContext, useEffect, useState, type ReactNode, type ReactElement } from 'react';

import type { Theme } from '@types';
import { getStorageItem, setStorageItem } from '@utils';

// ---------------------------------------------------------------------------
// Context types
// ---------------------------------------------------------------------------
interface ThemeContextValue {
  /** Current active theme */
  theme: Theme;
  /** Toggle between 'light' and 'dark' */
  toggleTheme: () => void;
  /** Set a specific theme */
  setTheme: (theme: Theme) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * useThemeContext — raw context consumer.
 * Prefer the `useTheme` hook from `@hooks` which adds convenience
 * properties (`isDark`, `isLight`).
 */
export const useThemeContext = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('[ThemeContext] useThemeContext must be used within a <ThemeProvider>');
  return ctx;
};

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
interface ThemeProviderProps {
  children?: ReactNode;
  /** Initial theme when no persisted preference exists (default: 'light') */
  defaultTheme?: Theme;
}

/**
 * ThemeProvider — manages the active theme, persists it to localStorage,
 * and applies `data-theme="<theme>"` to `<html>` so SCSS `[data-theme]`
 * selectors (e.g. `_dark.scss`) take effect globally.
 *
 * Wrap this around `<App />` in `main.tsx` or at the top of `<App />`.
 */
export const ThemeProvider = ({ children, defaultTheme = 'light' }: ThemeProviderProps): ReactElement => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = getStorageItem<string>('app-theme');
    if (stored === 'light' || stored === 'dark') return stored;
    // Respect OS preference if no stored value
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : defaultTheme;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    setStorageItem('app-theme', theme);
  }, [theme]);

  // Track live OS-level theme changes. Only apply when the user has not
  // manually chosen a theme (i.e. no stored preference).
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const stored = getStorageItem<string>('app-theme');
      if (stored === 'light' || stored === 'dark') return; // explicit user preference wins
      setThemeState(e.matches ? 'dark' : defaultTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [defaultTheme]);

  const toggleTheme = useCallback(() => setThemeState(t => (t === 'light' ? 'dark' : 'light')), []);
  const setTheme = useCallback((t: Theme) => setThemeState(t), []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
