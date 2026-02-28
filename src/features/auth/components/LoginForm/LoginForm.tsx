import type { FieldValues, Resolver } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@components';
import { Field } from '@components/ui/Field';
import { z } from 'zod';

import type { LoginPayload } from '../../types/auth.types';

import styles from './LoginForm.module.scss';

// ---------------------------------------------------------------------------
// Inline Zod resolver
// @hookform/resolvers v5 ships only utilities; write a thin adapter for Zod v4.
// Constraining to FieldValues lets TypeScript verify that T is a plain object
// record, matching react-hook-form's Resolver<T> expectation.
// ---------------------------------------------------------------------------

function makeZodResolver<T extends FieldValues>(schema: z.ZodType<T>): Resolver<T> {
  return async values => {
    const result = schema.safeParse(values);
    if (result.success) return { values: result.data, errors: {} };

    const errors: Record<string, { type: string; message: string }> = {};
    for (const issue of result.error.issues) {
      const key = String(issue.path[0] ?? issue.path.join('.'));
      if (!errors[key]) {
        errors[key] = { type: issue.code, message: issue.message };
      }
    }
    // Cast: RHF's ResolverError<T> expects values:Record<string,never>; `never`
    // extends every type so this is safe — the values are never read on error.
    return { errors: errors as never, values: {} as never };
  };
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface LoginFormProps {
  /** Called with validated form data on successful submission. */
  onSubmit: (payload: LoginPayload) => void | Promise<void>;
  /** When true the submit button shows a loading state. */
  isLoading?: boolean;
  /** Server-side error message to display below the form. */
  serverError?: string | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * LoginForm
 *
 * Controlled form built with react-hook-form + Zod validation.
 * Validation runs on submit first, then on change after first submission.
 */
export function LoginForm({ onSubmit, isLoading = false, serverError }: LoginFormProps) {
  const { t } = useTranslation();

  const loginSchema = z.object({
    email_or_username: z.string().min(1, t('auth.credentialRequired')),
    password: z.string().min(8, t('auth.passwordMin')),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof loginSchema>>({
    resolver: makeZodResolver(loginSchema),
    mode: 'onTouched',
  });

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <Field
        label={t('auth.credentialLabel')}
        type="text"
        autoComplete="username"
        error={errors.email_or_username?.message as string | undefined}
        {...register('email_or_username')}
      />

      <Field
        label={t('auth.passwordLabel')}
        type="password"
        autoComplete="current-password"
        error={errors.password?.message as string | undefined}
        {...register('password')}
      />

      {serverError && (
        <p className={styles.serverError} role="alert">
          {serverError}
        </p>
      )}

      <Button type="submit" loading={isLoading} loadingLabel={t('auth.loading')} fullWidth>
        {t('auth.submit')}
      </Button>
    </form>
  );
}
