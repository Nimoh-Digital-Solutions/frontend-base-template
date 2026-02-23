import { type ReactElement } from 'react';
import clsx from 'clsx';

import type { SpinnerProps } from './Spinner.interface';
import styles from './Spinner.module.scss';

/**
 * Spinner
 *
 * An animated loading indicator. Uses a pure-CSS border animation.
 * Respects `prefers-reduced-motion` — animation is removed on low-motion.
 *
 * @example
 * <Spinner />
 * <Spinner size="lg" label="Fetching data…" />
 */
export function Spinner({
  size = 'md',
  label = 'Loading…',
  className,
}: SpinnerProps): ReactElement {
  return (
    <span
      role="status"
      className={clsx(styles.spinner, styles[`spinner--${size}`], className)}
    >
      <span className={styles.circle} aria-hidden="true" />
      <span className={styles.srOnly}>{label}</span>
    </span>
  );
}

Spinner.displayName = 'Spinner';
