import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { PATHS } from '@routes/config/paths';

import styles from './LoginPage.module.scss';

/**
 * RegisterPage
 *
 * Route: /register
 *
 * Placeholder registration page. Replace with a full RegisterForm once
 * the registration flow is implemented for your project.
 */
export function RegisterPage() {
  const { t } = useTranslation();

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.heading}>
          {t('auth.register.pageTitle', 'Create Account')}
        </h1>
        <p className={styles.subheading}>
          {t('auth.register.subtitle', 'Registration form coming soon.')}
        </p>
        <p>
          {t('auth.register.alreadyHaveAccount', 'Already have an account?')}{' '}
          <Link to={PATHS.LOGIN}>{t('auth.signIn', 'Sign in')}</Link>
        </p>
      </div>
    </main>
  );
}
