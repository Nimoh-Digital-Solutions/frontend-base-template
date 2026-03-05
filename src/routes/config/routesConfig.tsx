import { lazy, type ReactElement,Suspense } from 'react';
import { RouteObject } from 'react-router-dom';

import ProtectedRoute from '@components/common/ProtectedRoute/ProtectedRoute';
import { AppLayout } from '@layouts';

import { PATHS, routeMetadata } from './paths';

import styles from './pageFallback.module.scss';

// Re-export PATHS and routeMetadata so existing imports from '@routes' / './config' still work
export { PATHS, routeMetadata };

// ---------------------------------------------------------------------------
// Route-level code splitting
// Each page is loaded as a separate chunk, fetched only when first visited.
// ---------------------------------------------------------------------------
const HomePage = lazy(() => import('@pages/HomePage/HomePage'));

const ComponentsDemoPage = lazy(() =>
  import('@pages/ComponentsDemoPage/ComponentsDemoPage').then(m => ({
    default: m.ComponentsDemoPage,
  }))
);

const NotFoundPage = lazy(() => import('@pages/NotFoundPage/NotFoundPage'));

const AuthPage = lazy(() =>
  import('@features/auth').then(m => ({ default: m.AuthPage }))
);

const ForgotPasswordPage = lazy(() =>
  import('@features/auth').then(m => ({ default: m.ForgotPasswordPage }))
);

const AuthRoutesWrapper = lazy(() =>
  import('@features/auth').then(m => ({ default: m.AuthRoutesWrapper }))
);

const SettingsPage = lazy(() => import('@pages/SettingsPage/SettingsPage'));

/**
 * Minimal loading state shown while a lazy page chunk is being fetched.
 * Replace with a proper <PageLoader /> component as the project grows.
 */
const PageFallback = (): ReactElement => <div className={styles.fallback}>Loading…</div>;

/** Convenience wrapper: lazy page inside Suspense. */
const LazyPage = ({ component: Component }: { component: React.LazyExoticComponent<() => ReactElement> }): ReactElement => (
  <Suspense fallback={<PageFallback />}>
    <Component />
  </Suspense>
);

/** Convenience wrapper: protected lazy page. */
const ProtectedPage = ({ component: Component }: { component: React.LazyExoticComponent<() => ReactElement> }): ReactElement => (
  <ProtectedRoute>
    <Suspense fallback={<PageFallback />}>
      <Component />
    </Suspense>
  </ProtectedRoute>
);

export const routes: RouteObject[] = [
  // ---------------------------------------------------------------------------
  // Auth route group
  // Full-screen split-panel pages — no AppLayout shell (no Header / Footer).
  // AuthRoutesWrapper redirects to HOME if the user is already authenticated.
  // ---------------------------------------------------------------------------
  {
    element: (
      <Suspense fallback={<PageFallback />}>
        <AuthRoutesWrapper />
      </Suspense>
    ),
    children: [
      {
        // AuthPage is a layout route that stays mounted for both /login and
        // /register, enabling the AuthSplitPanel layout-swap animation.
        element: (
          <Suspense fallback={<PageFallback />}>
            <AuthPage />
          </Suspense>
        ),
        children: [
          { path: PATHS.LOGIN },
          { path: PATHS.REGISTER },
        ],
      },
      {
        path: PATHS.FORGOT_PASSWORD,
        element: <LazyPage component={ForgotPasswordPage} />,
      },
    ],
  },
  // ---------------------------------------------------------------------------
  // App route group
  // Standard pages wrapped in AppLayout (Header + Footer + skip link).
  // ---------------------------------------------------------------------------
  {
    path: PATHS.HOME,
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <LazyPage component={HomePage} />,
      },
      {
        path: PATHS.COMPONENTS_DEMO,
        element: <LazyPage component={ComponentsDemoPage} />,
      },
      // -- Protected routes -------------------------------------------------
      // Add your authenticated routes here using the ProtectedPage wrapper:
      //
      //   {
      //     path: PATHS.DASHBOARD,
      //     element: <ProtectedPage component={DashboardPage} />,
      //   },
      {
        path: PATHS.SETTINGS,
        element: <ProtectedPage component={SettingsPage} />,
      },
    ],
  },
  {
    path: PATHS.NOT_FOUND,
    element: <LazyPage component={NotFoundPage} />,
  },
];

