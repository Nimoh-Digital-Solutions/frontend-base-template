// Components
export { ErrorBoundary } from './components/ErrorBoundary';
export { default as ProtectedRoute } from './components/ProtectedRoute/ProtectedRoute';
export { Button } from './components/Button';
export type { ButtonProps } from './components/Button';

// Theme
export { ThemeProvider, useThemeContext } from './contexts/ThemeContext';
export { useTheme } from './hooks/useTheme';
export type { UseThemeReturn } from './hooks/useTheme';
