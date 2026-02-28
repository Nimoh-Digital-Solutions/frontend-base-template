import { env } from './env';

/**
 * APP_CONFIG
 *
 * Typed, validated application configuration sourced from environment variables.
 * All values flow through the Zod schema in env.ts — if a variable is present but
 * malformed, the app throws at startup before any network call is made.
 *
 * Add new env vars to env.ts first, then surface them here.
 */
export const APP_CONFIG = {
  /** Base URL for API requests (validated as a URL in env.ts when present). */
  apiUrl: env.VITE_API_URL ?? '',

  /** Application display name — used in page titles, metadata, and PWA manifest. */
  appName: env.VITE_APP_TITLE ?? 'React Starter Kit',

  /** WebSocket base URL. Derived from apiUrl when not set explicitly. */
  wsUrl: env.VITE_WS_URL ?? '',

  /**
   * Feature flags (default off).
   * Add project-specific flags here, sourced from env.ts.
   *
   * Example:
   *   darkMode: env.VITE_FF_DARK_MODE === 'true',
   */
  features: {} as Record<string, boolean>,
};
