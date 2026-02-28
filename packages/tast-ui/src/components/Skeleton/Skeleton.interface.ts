export type SkeletonVariant = 'text' | 'circle' | 'rect';

export interface SkeletonProps {
  /** Shape of the skeleton — default 'text' */
  variant?: SkeletonVariant;
  /** Width (any CSS value). Defaults to '100%' for text/rect, '2.5rem' for circle. */
  width?: string | undefined;
  /** Height (any CSS value). Defaults to '1em' for text, '2.5rem' for circle, '6rem' for rect. */
  height?: string | undefined;
  /** Number of skeleton rows to render — only applies to 'text' variant. Default 1. */
  count?: number | undefined;
  /** Screen-reader label — default 'Loading…' */
  label?: string | undefined;
  className?: string | undefined;
}
