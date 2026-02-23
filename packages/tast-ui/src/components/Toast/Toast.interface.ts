export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface ToastProps {
  id: string;
  message: string;
  /** Visual style — default 'info' */
  variant?: ToastVariant;
  /** Called when the user dismisses the toast */
  onDismiss?: ((id: string) => void) | undefined;
}
