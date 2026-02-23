import { useState, useCallback } from 'react';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

let _nextId = 0;
function nextId(): string {
  return `toast-${++_nextId}`;
}

export interface UseToastReturn {
  toasts: ToastItem[];
  addToast: (message: string, variant?: ToastVariant, duration?: number) => string;
  dismissToast: (id: string) => void;
}

/**
 * useToast
 *
 * Manages a list of transient notifications.
 *
 * @example
 * const { toasts, addToast, dismissToast } = useToast();
 * addToast('Saved successfully!', 'success');
 * addToast('Something went wrong', 'error', 8000);
 */
export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string): void => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, variant: ToastVariant = 'info', duration = 5000): string => {
      const id = nextId();
      setToasts((prev) => [...prev, { id, message, variant }]);
      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
      return id;
    },
    [dismissToast],
  );

  return { toasts, addToast, dismissToast };
}
