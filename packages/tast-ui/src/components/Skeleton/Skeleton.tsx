import { type ReactElement } from 'react';
import clsx from 'clsx';

import type { SkeletonProps } from './Skeleton.interface';
import styles from './Skeleton.module.scss';

/**
 * Skeleton
 *
 * A pulsing placeholder that indicates content is loading.
 * Supports text lines, circular avatars, and rectangular blocks.
 * Respects `prefers-reduced-motion` — animation is replaced with static opacity.
 *
 * @example
 * <Skeleton />
 * <Skeleton variant="circle" width="3rem" height="3rem" />
 * <Skeleton variant="rect" height="10rem" />
 * <Skeleton variant="text" count={3} />
 */
export function Skeleton({
  variant = 'text',
  width,
  height,
  count = 1,
  label = 'Loading…',
  className,
}: SkeletonProps): ReactElement {
  const defaultWidth =
    width ?? (variant === 'circle' ? '2.5rem' : '100%');
  const defaultHeight =
    height ?? (variant === 'circle' ? '2.5rem' : variant === 'rect' ? '6rem' : '1em');

  const singleSkeleton = (key?: number): ReactElement => (
    <span
      key={key}
      className={clsx(styles.skeleton, styles[`skeleton--${variant}`], className)}
      style={{ width: defaultWidth, height: defaultHeight }}
      aria-hidden="true"
    />
  );

  if (variant === 'text' && count > 1) {
    return (
      <span role="status" className={styles.group}>
        {Array.from({ length: count }, (_, i) => singleSkeleton(i))}
        <span className={styles.srOnly}>{label}</span>
      </span>
    );
  }

  return (
    <span role="status" className={clsx(variant === 'text' && count === 1 && styles.group)}>
      {singleSkeleton()}
      <span className={styles.srOnly}>{label}</span>
    </span>
  );
}

Skeleton.displayName = 'Skeleton';
