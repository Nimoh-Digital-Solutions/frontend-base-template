import { type ReactNode, type ReactElement } from 'react';
import { Navigate } from 'react-router-dom';

import { PATHS } from '@routes/config/paths';

interface ProtectedRouteProps {
  /** Whether the current user passes the auth check */
  isAuthenticated: boolean;
  /** Content to render when authenticated */
  children: ReactNode;
  /**
   * Where to redirect unauthenticated users.
   * Defaults to `PATHS.HOME` — change to a dedicated `/login` path once
   * an authentication flow is wired in.
   */
  redirectTo?: string;
}

/**
 * ProtectedRoute — guards a route behind an authentication check.
 * Renders `children` when `isAuthenticated` is true; otherwise performs
 * a client-side redirect to `redirectTo`.
 *
 * ## Usage in routesConfig.tsx
 * ```tsx
 * import { ProtectedRoute } from '@components';
 *
 * {
 *   path: PATHS.DASHBOARD,
 *   element: (
 *     <Suspense fallback={<PageFallback />}>
 *       <ProtectedRoute isAuthenticated={isLoggedIn}>
 *         <DashboardPage />
 *       </ProtectedRoute>
 *     </Suspense>
 *   ),
 * }
 * ```
 *
 * ## Wiring authentication
 * Replace the `isAuthenticated` prop with a value from your auth
 * context/store once one is available:
 * ```tsx
 * const { isLoggedIn } = useAuth();
 * <ProtectedRoute isAuthenticated={isLoggedIn}>…</ProtectedRoute>
 * ```
 */
const ProtectedRoute = ({
  isAuthenticated,
  children,
  redirectTo = PATHS.HOME,
}: ProtectedRouteProps): ReactElement => {
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
