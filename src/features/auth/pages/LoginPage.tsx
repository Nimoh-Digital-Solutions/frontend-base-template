import { useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
import { LoginForm } from '../components/LoginForm/LoginForm';
import type { LoginPayload } from '../types/auth.types';

import styles from './LoginPage.module.scss';

/**
 * LoginPage
 *
 * Route: /login
 *
 * Composes the LoginForm with the useAuth hook.
 * On successful login the user is redirected to the home page.
 */
export function LoginPage() {
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (payload: LoginPayload) => {
    await login(payload);
    // TODO: only redirect when login succeeded — wire up isAuthenticated once
    // a persistent auth store (e.g. Zustand + localStorage) is in place.
    navigate('/');
  };

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.heading}>Sign in</h1>
        <p className={styles.subheading}>Welcome back — enter your credentials below.</p>
        <LoginForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          serverError={error}
        />
      </div>
    </main>
  );
}
