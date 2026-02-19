import { forwardRef, type ReactNode } from 'react';
import clsx from 'clsx';
import { PiSpinnerGapBold } from 'react-icons/pi';

import { ButtonProps } from './Button.interface';
import styles from './Button.module.scss';

/** Internal helper — renders the icon/spinner span without repetition */
const ButtonIcon = ({ children, 'data-testid': testId }: { children: ReactNode; 'data-testid'?: string }) => (
  <span className={styles.icon} aria-hidden="true" data-testid={testId}>
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
      loadingLabel,
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
        [styles.loading!]: loading,
        [styles.disabled!]: isDisabled,
        [styles.fullWidth!]: fullWidth,
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
        aria-label={loading && loadingLabel ? loadingLabel : undefined}
        {...props}
      >
        {loading && (
          <ButtonIcon data-testid="button-spinner">
            <PiSpinnerGapBold />
          </ButtonIcon>
        )}

        {!loading && icon && iconPosition === 'left' && (
          <ButtonIcon data-testid="button-icon">{icon}</ButtonIcon>
        )}

        <span className={styles.content} data-testid="button-content">{children}</span>

        {!loading && icon && iconPosition === 'right' && (
          <ButtonIcon data-testid="button-icon">{icon}</ButtonIcon>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
