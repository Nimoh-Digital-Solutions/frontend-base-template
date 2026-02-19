/**
 * APP_CONFIG
 *
 * Global application configuration loaded from environment variables.
 * Useful for centralising API URLs, feature flags, app names, and any
 * environment-specific settings.
 */
export const APP_CONFIG = {
  /** Base URL for API requests */
  apiUrl: import.meta.env.VITE_API_URL,

  /** Application name (used for titles, metadata, etc.) */
  appName: import.meta.env.VITE_APP_TITLE || 'React Starter Kit',
};
