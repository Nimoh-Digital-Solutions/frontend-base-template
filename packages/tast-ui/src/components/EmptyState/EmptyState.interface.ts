import type { ReactNode } from 'react';

export interface EmptyStateProps {
  /** Main heading text. */
  title: string;
  /** Optional description shown below the heading. */
  description?: string | undefined;
  /** Optional icon or illustration rendered above the title. */
  icon?: ReactNode | undefined;
  /** Optional action element (e.g. a Button) rendered below the description. */
  action?: ReactNode | undefined;
  className?: string | undefined;
}
