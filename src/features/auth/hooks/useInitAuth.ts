import { useEffect, useRef } from 'react';

import { logger } from '@utils/logger';

import { initAuthInterceptors } from '../interceptors';
import { authService } from '../services/auth.service';
import { setCsrfToken,useAuthStore } from '../stores/authStore';

/**
 * useInitAuth
 *
 * Called once in App.tsx to bootstrap the authentication subsystem:
 *
 * 1. Registers auth + CSRF interceptors on the shared HTTP client.
 * 2. Attempts a silent token refresh (httpOnly cookie → new access token).
 * 3. Fetches a CSRF token from the BE for mutating requests.
 * 4. Sets `isLoading: false` when auth initialisation is complete.
 *
 * While `isLoading` is true the app should show a loading screen — this
 * prevents a flash where protected routes briefly redirect to login before
 * the session is restored.
 *
 * @returns `{ isLoading }` — true while the auth bootstrap is in progress.
 */
export function useInitAuth(): { isLoading: boolean } {
  const isLoading = useAuthStore(s => s.isLoading);
  const setAuth = useAuthStore(s => s.setAuth);
  const clearAuth = useAuthStore(s => s.clearAuth);
  const hasRun = useRef(false);

  useEffect(() => {
    // Strict-mode double-mount guard
    if (hasRun.current) return;
    hasRun.current = true;

    // 1. Wire interceptors onto the shared HTTP client
    initAuthInterceptors();

    // 2. Bootstrap: silent refresh + CSRF fetch
    const bootstrap = async () => {
      // Signal that auth init is in progress
      useAuthStore.setState({ isLoading: true });

      try {
        // Attempt to restore session via httpOnly refresh cookie
        const refreshData = await authService.refreshToken();

        // Refresh succeeded — temporarily store the token so subsequent
        // requests (like getProfile) are authenticated.
        useAuthStore.setState({ accessToken: refreshData.access });

        // Fetch the full user profile from the BE
        const user = await authService.getProfile();
        setAuth(refreshData.access, user);
      } catch {
        // No valid session — stay unauthenticated (this is normal for first visit)
        clearAuth();
      }

      // Fetch CSRF token regardless of auth status (some public endpoints
      // may also require CSRF, e.g. registration).
      try {
        const token = await authService.fetchCsrfToken();
        setCsrfToken(token);
      } catch {
        // CSRF fetch failure is non-fatal — mutating requests will fail with
        // 403 and the user can retry. Log for observability.
        if (import.meta.env.DEV) {
          logger.warn('[auth] Failed to fetch CSRF token');
        }
      }

      // Auth initialisation complete
      useAuthStore.setState({ isLoading: false });
    };

    void bootstrap();
  }, [setAuth, clearAuth]);

  return { isLoading };
}
