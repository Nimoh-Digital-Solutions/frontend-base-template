import { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';
type IconPosition = 'left' | 'right';
type ButtonType = 'button' | 'submit' | 'reset';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  /** Visual style of the button - default 'primary' */
  variant?: ButtonVariant;
  /** Size of the button - default 'md' */
  size?: ButtonSize;
  /** Shows a loading spinner and disables the button - default false */
  loading?: boolean;
  /** Optional icon element */
  icon?: ReactNode;
  /** Position of the icon relative to the label - default 'left' */
  iconPosition?: IconPosition;
  /** Makes the button span the full width of its container - default false */
  fullWidth?: boolean;
  /** Button content */
  children: ReactNode;
  /** Button type attribute - default 'button' */
  type?: ButtonType;
}
