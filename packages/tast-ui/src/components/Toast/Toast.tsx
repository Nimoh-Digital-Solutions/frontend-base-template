import { type ReactElement } from 'react';
import { LuInfo, LuCheck, LuTriangleAlert, LuCircleAlert, LuX } from 'react-icons/lu';
import clsx from 'clsx';

import type { ToastProps, ToastVariant } from './Toast.interface';
import styles from './Toast.module.scss';

const VARIANT_ICONS: Record<ToastVariant, ReactElement> = {
  info:    <LuInfo    aria-hidden="true" />,
  success: <LuCheck   aria-hidden="true" />,
  warning: <LuTriangleAlert aria-hidden="true" />,
  error:   <LuCircleAlert   aria-hidden="true" />,
};

/**
 * Toast
 *
 * A single notification strip. Typically rendered inside a toast container
 * driven by `useToast()`.
 *
 * @example
 * <Toast id="t1" message="Saved!" variant="success" onDismiss={dismissToast} />
 */
export function Toast({
  id,
  message,
  variant = 'info',
  onDismiss,
}: ToastProps): ReactElement {
  return (
    <div
      role="status"
      aria-live="polite"
      className={clsx(styles.toast, styles[`toast--${variant}`])}
    >
      <span className={styles.icon}>{VARIANT_ICONS[variant]}</span>
      <span className={styles.message}>{message}</span>
      {onDismiss && (
        <button
          type="button"
          className={styles.dismissBtn}
          aria-label="Dismiss notification"
          onClick={() => onDismiss(id)}
        >
          <LuX aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

Toast.displayName = 'Toast';
