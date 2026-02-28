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

const LoginPage = lazy(() =>
  import('@features/auth').then(m => ({ default: m.LoginPage }))
);

const RegisterPage = lazy(() =>
  import('@features/auth').then(m => ({ default: m.RegisterPage }))
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
      {
        path: PATHS.LOGIN,
        element: <LazyPage component={LoginPage} />,
      },
      {
        path: PATHS.REGISTER,
        element: <LazyPage component={RegisterPage} />,
      },
      // -- Protected routes -----------------------------------------------
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

