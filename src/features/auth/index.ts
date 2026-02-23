/**
 * Auth feature public API
 *
 * Import from '@features/auth' in consuming code — never reach
 * into sub-directories directly from outside this feature.
 *
 * @example
 * import { LoginPage, useAuth } from '@features/auth';
 */
export { LoginPage } from './pages/LoginPage';
export { useAuth } from './hooks/useAuth';
export type { LoginPayload, AuthUser, AuthState } from './types/auth.types';
