import { forwardRef, useId, type ReactElement } from 'react';
import clsx from 'clsx';

import type { InputProps } from './Input.interface';
import styles from './Input.module.scss';

/**
 * Input
 *
 * A labelled, accessible text input component.
 * Forwards the ref to the underlying `<input>` for react-hook-form compatibility.
 *
 * @example
 * <Input label="Email" type="email" />
 * <Input label="Email" error={errors.email?.message} {...register('email')} />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, helperText, size = 'md', className, id: externalId, ...inputProps },
    ref,
  ): ReactElement => {
    const generatedId = useId();
    const id = externalId ?? generatedId;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;
    const hasError = Boolean(error);

    return (
      <div className={clsx(styles.wrapper, hasError && styles.hasError, className)}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>

        <input
          {...inputProps}
          ref={ref}
          id={id}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : helperText ? hintId : undefined}
          className={clsx(styles.input, styles[`input--${size}`])}
        />

        {hasError && (
          <span id={errorId} role="alert" className={styles.error}>
            {error}
          </span>
        )}

        {!hasError && helperText && (
          <span id={hintId} className={styles.hint}>
            {helperText}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
