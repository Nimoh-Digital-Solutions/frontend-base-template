// Common type definitions

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  message?: string;
}

// ---------------------------------------------------------------------------
// Paginated response — matches DRF PageNumberPagination envelope
// ---------------------------------------------------------------------------

export interface PaginatedResponse<T = unknown> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ---------------------------------------------------------------------------
// RFC 7807 Problem Detail — matches nimoh_base exception handler format
// ---------------------------------------------------------------------------

export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string | Record<string, string[]>;
  instance?: string;
  invalid_params?: Array<{ name: string; reason: string }>;
}

export type Theme = 'light' | 'dark' | 'dim';

// ---------------------------------------------------------------------------
// PWA Types
// ---------------------------------------------------------------------------

export type DisplayMode = 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
export type ConnectionType = 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';

export type BeforeInstallPromptEventLike = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export interface PWAUpdatePromptProps {
  onUpdate: () => void;
  onDismiss: () => void;
}

export interface PWAManifest {
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  scope: string;
  display: DisplayMode;
  orientation:
    | 'portrait-primary'
    | 'portrait-secondary'
    | 'landscape-primary'
    | 'landscape-secondary';
  background_color: string;
  theme_color: string;
  categories: string[];
  icons: PWAIcon[];
}

export interface PWAIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: 'any' | 'maskable' | 'monochrome';
}

export interface PWAConfig {
  strategies: 'generateSW' | 'injectManifest';
  registerType: 'autoUpdate' | 'prompt' | 'skipWaiting';
  manifest: boolean | PWAManifest;
  includeAssets: string[];
  workbox: WorkboxConfig;
  devOptions: DevOptions;
}

export interface WorkboxConfig {
  navigateFallback: string;
  runtimeCaching: RuntimeCache[];
  cleanupOutdatedCaches: boolean;
  skipWaiting: boolean;
  clientsClaim: boolean;
}

export interface RuntimeCache {
  urlPattern: string | RegExp | ((options: { request: Request }) => boolean);
  handler: 'CacheFirst' | 'NetworkFirst' | 'StaleWhileRevalidate' | 'NetworkOnly' | 'CacheOnly';
  options: CacheOptions;
}

export interface CacheOptions {
  cacheName: string;
  expiration?: {
    maxEntries: number;
    maxAgeSeconds: number;
  };
  networkTimeoutSeconds?: number;
}

export interface DevOptions {
  enabled: boolean;
  type?: 'module' | 'classic';
}
