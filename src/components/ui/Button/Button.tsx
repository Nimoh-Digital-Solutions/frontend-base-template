import { forwardRef, type ReactNode } from 'react';
import clsx from 'clsx';
import { PiSpinnerGapBold } from 'react-icons/pi';

import { ButtonProps } from './Button.interface';
import styles from './Button.module.scss';

/** Internal helper — renders the icon/spinner span without repetition */
const ButtonIcon = ({ children }: { children: ReactNode }) => (
  <span className={styles.icon} aria-hidden="true">
    {children}
  </span>
);

/**
 * Button
 *
 * A reusable, accessible button component.
 *
 * - Wraps a native `<button>`
 * - Defaults to `type="button"` to avoid accidental form submits
 * - Disables itself when `loading` is true
 * - Shows a spinner while loading
 * - Supports icons on either side
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      className,
      type = 'button',
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const buttonClasses = clsx(
      styles.root,
      styles[`root--${variant}`],
      styles[`root--${size}`],
      {
        [styles.loading]: loading,
        [styles.disabled]: isDisabled,
        [styles.fullWidth]: fullWidth,
      },
      className
    );

    return (
      <button
        ref={ref}
        type={type}
        className={buttonClasses}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && (
          <ButtonIcon>
            <PiSpinnerGapBold />
          </ButtonIcon>
        )}

        {!loading && icon && iconPosition === 'left' && (
          <ButtonIcon>{icon}</ButtonIcon>
        )}

        <span className={styles.content}>{children}</span>

        {!loading && icon && iconPosition === 'right' && (
          <ButtonIcon>{icon}</ButtonIcon>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
