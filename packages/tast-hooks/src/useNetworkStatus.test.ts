import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useNetworkStatus, useIsOnline } from './useNetworkStatus';

// ---------------------------------------------------------------------------
// Helpers — simulate online/offline events
// ---------------------------------------------------------------------------

function goOffline(): void {
  Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
  window.dispatchEvent(new Event('offline'));
}

function goOnline(): void {
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  window.dispatchEvent(new Event('online'));
}

afterEach(() => {
  // Reset navigator.onLine to true after each test
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
});

// ---------------------------------------------------------------------------
// useNetworkStatus
// ---------------------------------------------------------------------------

describe('useNetworkStatus', () => {
  it('returns online by default', () => {
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(true);
    expect(result.current.offlineSince).toBeNull();
  });

  it('detects offline transition', () => {
    const { result } = renderHook(() => useNetworkStatus());

    act(() => {
      goOffline();
    });

    expect(result.current.isOnline).toBe(false);
    expect(result.current.offlineSince).toBeTypeOf('number');
  });

  it('recovers from offline → online', () => {
    const { result } = renderHook(() => useNetworkStatus());

    act(() => {
      goOffline();
    });

    expect(result.current.isOnline).toBe(false);

    act(() => {
      goOnline();
    });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.offlineSince).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// useIsOnline
// ---------------------------------------------------------------------------

describe('useIsOnline', () => {
  it('returns true when online', () => {
    const { result } = renderHook(() => useIsOnline());
    expect(result.current).toBe(true);
  });

  it('returns false when offline', () => {
    const { result } = renderHook(() => useIsOnline());

    act(() => {
      goOffline();
    });

    expect(result.current).toBe(false);
  });
});
