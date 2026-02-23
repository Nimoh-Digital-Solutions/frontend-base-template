// Components
export { ErrorBoundary } from './components/ErrorBoundary';
export { default as ProtectedRoute } from './components/ProtectedRoute/ProtectedRoute';
export { Button } from './components/Button';
export type { ButtonProps } from './components/Button';
export { Input } from './components/Input';
export type { InputProps, InputSize } from './components/Input';
export { Textarea } from './components/Textarea';
export type { TextareaProps } from './components/Textarea';
export { Badge } from './components/Badge';
export type { BadgeProps, BadgeVariant, BadgeSize } from './components/Badge';
export { Spinner } from './components/Spinner';
export type { SpinnerProps, SpinnerSize } from './components/Spinner';
export { Card } from './components/Card';
export type { CardProps, CardPadding, CardShadow } from './components/Card';
export { Modal } from './components/Modal';
export type { ModalProps } from './components/Modal';
export { Toast } from './components/Toast';
export type { ToastProps, ToastVariant } from './components/Toast';

// Theme
export { ThemeProvider, useThemeContext } from './contexts/ThemeContext';
export { useTheme } from './hooks/useTheme';
export type { UseThemeReturn } from './hooks/useTheme';
