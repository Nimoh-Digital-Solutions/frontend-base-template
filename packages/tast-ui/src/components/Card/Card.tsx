import { type ReactElement } from 'react';
import clsx from 'clsx';

import type { CardProps } from './Card.interface';
import styles from './Card.module.scss';

/**
 * Card
 *
 * A surface element that groups related content.
 *
 * @example
 * <Card padding="md" shadow="sm">
 *   <p>Hello world</p>
 * </Card>
 */
export function Card({
  padding = 'md',
  shadow = 'none',
  children,
  className,
  ...props
}: CardProps): ReactElement {
  return (
    <div
      {...props}
      className={clsx(
        styles.card,
        styles[`card--padding-${padding}`],
        styles[`card--shadow-${shadow}`],
        className,
      )}
    >
      {children}
    </div>
  );
}

Card.displayName = 'Card';
