import { HTMLAttributes, ReactNode } from 'react';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'neutral' | 'info';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Visual style — default 'neutral' */
  variant?: BadgeVariant;
  /** Size — default 'md' */
  size?: BadgeSize;
  children: ReactNode;
}
