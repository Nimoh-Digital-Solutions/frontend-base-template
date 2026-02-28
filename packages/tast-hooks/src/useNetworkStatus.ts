import { useCallback, useEffect, useSyncExternalStore } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NetworkStatus {
  /** `true` when the browser reports an active network connection. */
  isOnline: boolean;
  /** Timestamp (ms) of the last online → offline transition, or `null`. */
  offlineSince: number | null;
}

// ---------------------------------------------------------------------------
// External store for navigator.onLine
// ---------------------------------------------------------------------------

/** Module-scoped snapshot that React can subscribe to via useSyncExternalStore. */
let snapshot: NetworkStatus = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  offlineSince: null,
};

type Listener = () => void;
const listeners = new Set<Listener>();

function emitChange(): void {
  // Create a new reference so React detects the change
  snapshot = { ...snapshot };
  listeners.forEach((l) => l());
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): NetworkStatus {
  return snapshot;
}

/** SSR-safe snapshot — assume online during server renders. */
function getServerSnapshot(): NetworkStatus {
  return { isOnline: true, offlineSince: null };
}

// ---------------------------------------------------------------------------
// Global event listeners (registered once, shared across all hook instances)
// ---------------------------------------------------------------------------
let eventsRegistered = false;

function registerGlobalEvents(): void {
  if (eventsRegistered || typeof window === 'undefined') return;
  eventsRegistered = true;

  window.addEventListener('online', () => {
    snapshot = { isOnline: true, offlineSince: null };
    emitChange();
  });

  window.addEventListener('offline', () => {
    snapshot = { isOnline: false, offlineSince: Date.now() };
    emitChange();
  });
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useNetworkStatus — reactive hook that tracks browser online/offline state.
 *
 * Uses `useSyncExternalStore` to subscribe to `window` online/offline events
 * with zero re-renders when the status hasn't changed.
 *
 * @returns `NetworkStatus` — `{ isOnline, offlineSince }`
 *
 * @example
 * function OfflineBanner() {
 *   const { isOnline, offlineSince } = useNetworkStatus();
 *
 *   if (isOnline) return null;
 *
 *   return (
 *     <div role="alert">
 *       You are offline since {new Date(offlineSince!).toLocaleTimeString()}.
 *       Some features may be unavailable.
 *     </div>
 *   );
 * }
 */
export function useNetworkStatus(): NetworkStatus {
  // Ensure global listeners are attached on first mount
  useEffect(() => {
    registerGlobalEvents();
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * useIsOnline — convenience wrapper that returns a simple boolean.
 *
 * @example
 * const isOnline = useIsOnline();
 * if (!isOnline) disableSubmitButton();
 */
export function useIsOnline(): boolean {
  const { isOnline } = useNetworkStatus();
  return isOnline;
}
