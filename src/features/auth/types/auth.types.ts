/**
 * auth.types.ts
 *
 * Shared type contracts for the auth feature.
 * These are used by the service layer, hook, and form schema.
 */

/** Payload sent to the /auth/login endpoint. */
export interface LoginPayload {
  email: string;
  password: string;
}

/** A successfully authenticated user returned from the API. */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

/** The shape of the auth slice in application state. */
export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
