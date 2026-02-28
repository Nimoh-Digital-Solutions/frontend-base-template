import { useTranslation } from 'react-i18next';
import { useLocation,useNavigate } from 'react-router-dom';

import { LoginForm } from '../components/LoginForm/LoginForm';
import { useAuth } from '../hooks/useAuth';
import type { LoginPayload } from '../types/auth.types';

import styles from './LoginPage.module.scss';

/**
 * LoginPage
 *
 * Route: /login
 *
 * Composes the LoginForm with the useAuth hook.
 * On successful login the user is redirected to either the original
 * page they tried to access (captured via `returnUrl` state from
 * ProtectedRoute) or the home page.
 */
export function LoginPage() {
  const { t } = useTranslation();
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ProtectedRoute passes the original URL via router state
  const returnUrl = (location.state as { returnUrl?: string } | null)?.returnUrl;

  const handleSubmit = async (payload: LoginPayload) => {
    try {
      await login(payload);
      void navigate(returnUrl ?? '/', { replace: true });
    } catch {
      // Error is already captured in the store's `error` state
      // and displayed via `serverError` prop on LoginForm.
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.heading}>{t('auth.pageTitle')}</h1>
        <p className={styles.subheading}>{t('auth.welcomeBack')}</p>
        <LoginForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          serverError={error}
        />
      </div>
    </main>
  );
}
