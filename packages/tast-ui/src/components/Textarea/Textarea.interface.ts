import { TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Visible label rendered above the textarea */
  label: string;
  /** Validation error message — triggers error styling and aria-invalid */
  error?: string | undefined;
  /** Optional hint shown below the textarea when there is no error */
  helperText?: string | undefined;
  /** Number of visible text rows — default 4 */
  rows?: number;
  /** CSS resize behaviour — default 'vertical' */
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}
