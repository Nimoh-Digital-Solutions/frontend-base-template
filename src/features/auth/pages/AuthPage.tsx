import { useLocation, useNavigate } from 'react-router-dom';

import { useDocumentTitle } from '@hooks';
import { PATHS, routeMetadata } from '@routes/config/paths';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { AuthBranding } from '../components/AuthBranding/AuthBranding';
import { AuthSplitPanel } from '../components/AuthSplitPanel/AuthSplitPanel';
import { LoginForm } from '../components/LoginForm/LoginForm';
import { RegisterForm } from '../components/RegisterForm/RegisterForm';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/auth.service';
import type { LoginPayload, RegisterPayload } from '../types/auth.types';

/**
 * AuthPage
 *
 * Single component that handles both /login and /register routes.
 * By rendering as a shared layout route parent for both paths it stays
 * mounted during navigation, allowing AuthSplitPanel's `motion.div layout`
 * animation to fire when `isLogin` changes instead of being destroyed and
 * recreated on every route transition.
 *
 * Route tree:
 *   AuthRoutesWrapper
 *     AuthPage  ← stays mounted
 *       /login
 *       /register
 */
export function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  const isLogin = location.pathname !== PATHS.REGISTER;

  useDocumentTitle(
    isLogin ? routeMetadata[PATHS.LOGIN].title : routeMetadata[PATHS.REGISTER].title,
  );

  // ── Login logic ────────────────────────────────────────────────────────
  const { login, isLoading, error } = useAuth();
  const returnUrl = (location.state as { returnUrl?: string } | null)?.returnUrl;

  const handleLoginSubmit = async (payload: LoginPayload) => {
    try {
      await login(payload);
      void navigate(returnUrl ?? PATHS.HOME, { replace: true });
    } catch {
      // error is captured in the auth store's `error` state
    }
  };

  // ── Register logic ─────────────────────────────────────────────────────
  const handleRegisterSubmit = async (payload: RegisterPayload) => {
    await authService.register(payload);
    void navigate(PATHS.LOGIN, {
      replace: true,
      state: { registered: true },
    });
  };

  // ── Toggle between login / register ───────────────────────────────────
  const handleToggle = () =>
    void navigate(isLogin ? PATHS.REGISTER : PATHS.LOGIN, { replace: true });

  // ── Form content animation ─────────────────────────────────────────────
  const formVariants = prefersReducedMotion
    ? {}
    : {
        initial: (login: boolean) => ({ opacity: 0, x: login ? 20 : -20 }),
        animate: { opacity: 1, x: 0 },
        exit: (login: boolean) => ({ opacity: 0, x: login ? -20 : 20 }),
      };

  const formTransition = { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <AuthSplitPanel
      isLogin={isLogin}
      brandingContent={<AuthBranding isLogin={isLogin} />}
      formContent={
        <AnimatePresence mode="wait" custom={isLogin}>
          {isLogin ? (
            <motion.div
              key="login"
              custom={isLogin}
              variants={formVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={formTransition}
            >
              <LoginForm
                onSubmit={handleLoginSubmit}
                onToggle={handleToggle}
                isLoading={isLoading}
                serverError={error}
              />
            </motion.div>
          ) : (
            <motion.div
              key="register"
              custom={isLogin}
              variants={formVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={formTransition}
            >
              <RegisterForm
                onSubmit={handleRegisterSubmit}
                onToggle={handleToggle}
              />
            </motion.div>
          )}
        </AnimatePresence>
      }
    />
  );
}
