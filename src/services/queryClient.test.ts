import { describe, expect, it, vi } from 'vitest';

import { queryClient } from './queryClient';

vi.mock('@configs', () => ({
  APP_CONFIG: { apiUrl: 'https://api.example.com', appName: 'Test App' },
}));

describe('queryClient', () => {
  it('is a QueryClient instance', () => {
    expect(queryClient).toBeDefined();
    expect(typeof queryClient.getQueryData).toBe('function');
    expect(typeof queryClient.invalidateQueries).toBe('function');
  });

  it('has default query options configured', () => {
    const defaults = queryClient.getDefaultOptions();

    expect(defaults.queries?.staleTime).toBe(5 * 60 * 1000);
    expect(defaults.queries?.gcTime).toBe(10 * 60 * 1000);
    expect(defaults.queries?.refetchOnWindowFocus).toBe(true);
    expect(defaults.queries?.refetchOnReconnect).toBe(true);
  });

  it('disables retry for mutations by default', () => {
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.mutations?.retry).toBe(false);
  });

  it('uses smart retry logic for queries', () => {
    const defaults = queryClient.getDefaultOptions();
    // retry is a function (not a boolean or number)
    expect(typeof defaults.queries?.retry).toBe('function');
  });
});
