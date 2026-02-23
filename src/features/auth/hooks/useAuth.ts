import { useState, useCallback } from 'react';

import { authService } from '../services/auth.service';
import type { AuthState, LoginPayload } from '../types/auth.types';

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

/**
 * useAuth
 *
 * Stub hook for authentication. Manages local auth state.
 * Replace with a context-backed or Zustand-backed implementation
 * once JWT persistence / token refresh are wired up.
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>(initialState);

  const login = useCallback(async (payload: LoginPayload) => {
    setState(s => ({ ...s, isLoading: true, error: null }));
    try {
      const { user } = await authService.login(payload);
      setState({ user, isAuthenticated: true, isLoading: false, error: null });
    } catch (err) {
      setState(s => ({
        ...s,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Login failed',
      }));
    }
  }, []);

  const logout = useCallback(async () => {
    setState(s => ({ ...s, isLoading: true }));
    try {
      await authService.logout();
    } finally {
      setState(initialState);
    }
  }, []);

  return { ...state, login, logout };
}
