// Types
export type {
  ApiResponse,
  Theme,
  DisplayMode,
  ConnectionType,
  BeforeInstallPromptEventLike,
  PWAUpdatePromptProps,
  PWAManifest,
  PWAIcon,
  PWAConfig,
  WorkboxConfig,
  RuntimeCache,
  CacheOptions,
  DevOptions,
} from './types';

// Formatters
export { formatDate, truncateString, capitalize } from './formatters';

// Helpers
export { debounce, throttle, generateId, isEmpty, deepClone } from './helpers';

// Storage
export {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  clearStorage,
  hasStorageItem,
} from './storage';

// PWA utilities
export {
  pwaState,
} from './_pwa-state';
export {
  registerPWAInstallPromptListener,
  canPromptPWAInstall,
  promptPWAInstall,
  isPWA,
  getDisplayMode,
  isIOS,
  isAndroid,
  supportsServiceWorker,
  getConnectionType,
  isSlowConnection,
  getAppVersionFromSW,
} from './pwa';

// HTTP
export { HttpError, createHttpClient } from './http';
export type { HttpClient } from './http';
