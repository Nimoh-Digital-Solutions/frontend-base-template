import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

// Reset localStorage before each test to prevent state leaking between tests
beforeEach(() => {
  localStorage.clear();
});

// Cleanup React tree after each test case
afterEach(() => {
  cleanup();
});
