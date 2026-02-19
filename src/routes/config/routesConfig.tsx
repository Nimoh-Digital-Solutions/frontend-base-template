import { lazy, Suspense } from 'react';
import { RouteObject } from 'react-router-dom';

import { AppLayout } from '@layouts';

import { PATHS, routeMetadata } from './paths';

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

/**
 * Minimal loading state shown while a lazy page chunk is being fetched.
 * Replace with a proper <PageLoader /> component as the project grows.
 */
const PageFallback = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '50vh',
      fontSize: '1rem',
      color: '#666',
    }}
  >
    Loading…
  </div>
);

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

