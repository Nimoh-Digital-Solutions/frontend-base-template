import { InputHTMLAttributes } from 'react';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Visible label rendered above the input */
  label: string;
  /** Validation error message — triggers error styling and aria-invalid */
  error?: string | undefined;
  /** Optional hint shown below the input when there is no error */
  helperText?: string | undefined;
  /** Controls input padding and font size — default 'md' */
  size?: InputSize;
}
