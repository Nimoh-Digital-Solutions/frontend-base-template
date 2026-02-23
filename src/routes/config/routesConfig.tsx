import { lazy, Suspense, type ReactElement } from 'react';
import { RouteObject } from 'react-router-dom';

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

/**
 * Minimal loading state shown while a lazy page chunk is being fetched.
 * Replace with a proper <PageLoader /> component as the project grows.
 */
const PageFallback = (): ReactElement => <div className={styles.fallback}>Loading…</div>;

export const routes: RouteObject[] = [
  {
    path: PATHS.HOME,
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageFallback />}>
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: PATHS.COMPONENTS_DEMO,
        element: (
          <Suspense fallback={<PageFallback />}>
            <ComponentsDemoPage />
          </Suspense>
        ),
      },
      {
        path: PATHS.LOGIN,
        element: (
          <Suspense fallback={<PageFallback />}>
            <LoginPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: PATHS.NOT_FOUND,
    element: (
      <Suspense fallback={<PageFallback />}>
        <NotFoundPage />
      </Suspense>
    ),
  },
];

// Route metadata now lives in paths.ts alongside PATHS to break the
// routesConfig → AppLayout → Header circular import chain.
// Kept as a re-export above for backward compatibility.

