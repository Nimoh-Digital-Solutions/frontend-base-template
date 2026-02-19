import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// window.matchMedia mock
// jsdom does not implement matchMedia. This stub prevents crashes in any
// component or hook that calls window.matchMedia (e.g. ThemeProvider).
// ---------------------------------------------------------------------------
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Reset localStorage before each test to prevent state leaking between tests
beforeEach(() => {
  localStorage.clear();
});

// Cleanup React tree after each test case
afterEach(() => {
  cleanup();
});
