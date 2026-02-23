import { HTMLAttributes, ReactNode } from 'react';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';
export type CardShadow = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Inner padding — default 'md' */
  padding?: CardPadding;
  /** Drop shadow depth — default 'none' */
  shadow?: CardShadow;
  children: ReactNode;
}
