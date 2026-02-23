import { type ReactElement } from 'react';
import clsx from 'clsx';

import type { BadgeProps } from './Badge.interface';
import styles from './Badge.module.scss';

/**
 * Badge
 *
 * A small pill-shaped status indicator.
 *
 * @example
 * <Badge variant="success">Active</Badge>
 * <Badge variant="error" size="sm">Failed</Badge>
 */
export function Badge({
  variant = 'neutral',
  size = 'md',
  children,
  className,
  ...props
}: BadgeProps): ReactElement {
  return (
    <span
      {...props}
      className={clsx(
        styles.badge,
        styles[`badge--${variant}`],
        styles[`badge--${size}`],
        className,
      )}
    >
      {children}
    </span>
  );
}

Badge.displayName = 'Badge';
