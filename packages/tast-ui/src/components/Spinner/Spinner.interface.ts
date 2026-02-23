export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps {
  /** Size of the spinner — default 'md' */
  size?: SpinnerSize;
  /** Screen-reader label — default 'Loading…' */
  label?: string | undefined;
  className?: string | undefined;
}
