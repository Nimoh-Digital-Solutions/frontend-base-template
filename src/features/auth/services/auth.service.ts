import { http } from '@services';
import type { AuthUser, LoginPayload } from '../types/auth.types';

/**
 * authService
 *
 * Thin wrappers around the HTTP client for auth-related endpoints.
 * Swap the base paths here once the real API contract is known.
 */
export const authService = {
  /**
   * Log in with email + password.
   * Returns an access token on success.
   */
  async login(payload: LoginPayload): Promise<{ token: string; user: AuthUser }> {
    const { data } = await http.post<{ token: string; user: AuthUser }>(
      '/auth/login',
      payload,
    );
    return data;
  },

  /**
   * Invalidate the current session on the server.
   */
  async logout(): Promise<void> {
    await http.post('/auth/logout', {});
  },
};
