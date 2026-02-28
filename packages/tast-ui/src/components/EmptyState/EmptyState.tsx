import { type ReactElement } from 'react';
import clsx from 'clsx';

import type { EmptyStateProps } from './EmptyState.interface';
import styles from './EmptyState.module.scss';

/**
 * EmptyState
 *
 * A centred placeholder shown when a list or section has no data.
 * Accepts an optional icon, description, and call-to-action button.
 *
 * @example
 * <EmptyState title="No items yet" description="Create your first item." />
 * <EmptyState
 *   title="Nothing here"
 *   icon={<InboxIcon />}
 *   action={<Button>Create</Button>}
 * />
 */
export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps): ReactElement {
  return (
    <div role="status" className={clsx(styles.emptyState, className)}>
      {icon && <div className={styles.icon} aria-hidden="true">{icon}</div>}
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}

EmptyState.displayName = 'EmptyState';
