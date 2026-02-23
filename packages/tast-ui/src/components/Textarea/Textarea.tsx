import { forwardRef, useId, type CSSProperties, type ReactElement } from 'react';
import clsx from 'clsx';

import type { TextareaProps } from './Textarea.interface';
import styles from './Textarea.module.scss';

/**
 * Textarea
 *
 * A labelled, accessible multi-line text input component.
 * Forwards the ref to the underlying `<textarea>` for react-hook-form compatibility.
 *
 * @example
 * <Textarea label="Message" rows={6} />
 * <Textarea label="Bio" error={errors.bio?.message} {...register('bio')} />
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      rows = 4,
      resize = 'vertical',
      className,
      id: externalId,
      style,
      ...textareaProps
    },
    ref,
  ): ReactElement => {
    const generatedId = useId();
    const id = externalId ?? generatedId;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;
    const hasError = Boolean(error);

    const inlineStyle: CSSProperties = { resize, ...style };

    return (
      <div className={clsx(styles.wrapper, hasError && styles.hasError, className)}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>

        <textarea
          {...textareaProps}
          ref={ref}
          id={id}
          rows={rows}
          style={inlineStyle}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : helperText ? hintId : undefined}
          className={styles.textarea}
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

Textarea.displayName = 'Textarea';
