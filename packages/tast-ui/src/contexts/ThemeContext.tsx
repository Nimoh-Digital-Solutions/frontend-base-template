import { createContext, useCallback, useContext, useEffect, useState, type ReactNode, type ReactElement } from 'react';

import type { Theme } from '@nimoh-digital-solutions/tast-utils';
import { getStorageItem, removeStorageItem, setStorageItem } from '@nimoh-digital-solutions/tast-utils';

// ---------------------------------------------------------------------------
// Context types
// ---------------------------------------------------------------------------
interface ThemeContextValue {
  /** Current active theme */
  theme: Theme;
  /** User's explicitly preferred default theme (stored separately from the active theme) */
  preferredTheme: Theme | null;
  /** Toggle between 'light', 'dim', and 'dark' */
  toggleTheme: () => void;
  /** Set a specific theme */
  setTheme: (theme: Theme) => void;
  /** Persist the given theme as the default preference (used to bias OS-dark → dim) */
  setPreferredTheme: (theme: Theme | null) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * useThemeContext — raw context consumer.
 * Prefer the `useTheme` hook which adds convenience properties (`isDark`, `isLight`).
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
  const [preferredTheme, setPreferredThemeState] = useState<Theme | null>(() => {
    const stored = getStorageItem<string>('app-theme-preferred');
    if (stored === 'light' || stored === 'dark' || stored === 'dim') return stored;
    return null;
  });

  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = getStorageItem<string>('app-theme');
    if (stored === 'light' || stored === 'dark' || stored === 'dim') return stored;
    // Respect OS preference if no stored value; preferredTheme biases OS dark → dim
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      const pref = getStorageItem<string>('app-theme-preferred');
      return pref === 'dim' ? 'dim' : 'dark';
    }
    return defaultTheme;
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
      if (stored === 'light' || stored === 'dark' || stored === 'dim') return; // explicit user preference wins
      if (e.matches) {
        // OS switched to dark — honour preferredTheme=dim bias
        const pref = getStorageItem<string>('app-theme-preferred');
        setThemeState(pref === 'dim' ? 'dim' : 'dark');
      } else {
        setThemeState(defaultTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [defaultTheme]);

  const toggleTheme = useCallback(() =>
    setThemeState(t => t === 'light' ? 'dim' : t === 'dim' ? 'dark' : 'light'),
  []);
  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const setPreferredTheme = useCallback((newPreferred: Theme | null) => {
    if (newPreferred) {
      setStorageItem('app-theme-preferred', newPreferred);
    } else {
      removeStorageItem('app-theme-preferred');
    }
    setPreferredThemeState(newPreferred);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, preferredTheme, toggleTheme, setTheme, setPreferredTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
