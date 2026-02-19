import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import type { Theme } from '@types';

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
  children: ReactNode;
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
export const ThemeProvider = ({ children, defaultTheme = 'light' }: ThemeProviderProps) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem('app-theme');
    if (stored === 'light' || stored === 'dark') return stored;
    // Respect OS preference if no stored value
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : defaultTheme;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleTheme = () => setThemeState(t => (t === 'light' ? 'dark' : 'light'));
  const setTheme = (t: Theme) => setThemeState(t);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
