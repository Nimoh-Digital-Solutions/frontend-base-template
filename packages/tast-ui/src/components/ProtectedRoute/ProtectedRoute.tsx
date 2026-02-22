import { type ReactNode, type ReactElement } from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  /** Whether the current user passes the auth check */
  isAuthenticated: boolean;
  /** Content to render when authenticated */
  children: ReactNode;
  /**
   * Where to redirect unauthenticated users.
   * Defaults to `'/'` — change to a dedicated `/login` path once
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
 * import { ProtectedRoute } from '@nimoh-digital-solutions/tast-ui';
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
  redirectTo = '/',
}: ProtectedRouteProps): ReactElement => {
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
