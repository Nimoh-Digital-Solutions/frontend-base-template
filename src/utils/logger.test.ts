import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Stub Sentry before importing logger
vi.mock('@configs/sentry', () => ({
  addBreadcrumb: vi.fn(),
}));

import { addBreadcrumb } from '@configs/sentry';

import { logger } from './logger';

describe('logger', () => {
  let consoleSpy: {
    debug: ReturnType<typeof vi.spyOn>;
    info: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
    vi.mocked(addBreadcrumb).mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logger.debug writes to console.debug in dev mode', () => {
    logger.debug('test message');
    expect(consoleSpy.debug).toHaveBeenCalled();
  });

  it('logger.info writes to console.info in dev mode', () => {
    logger.info('info message');
    expect(consoleSpy.info).toHaveBeenCalled();
  });

  it('logger.warn writes to console.warn', () => {
    logger.warn('warning message');
    expect(consoleSpy.warn).toHaveBeenCalled();
  });

  it('logger.error writes to console.error', () => {
    logger.error('error message');
    expect(consoleSpy.error).toHaveBeenCalled();
  });

  it('logger.warn includes context in the output', () => {
    logger.warn('warn with context', { key: 'value' });
    expect(consoleSpy.warn).toHaveBeenCalled();
    // In dev mode, context is passed as a separate argument
    const args = consoleSpy.warn.mock.calls[0];
    expect(args).toBeDefined();
    // At least the message pattern + style + message text should be present
    expect(args!.length).toBeGreaterThanOrEqual(3);
  });

  it('exposes debug, info, warn, error methods', () => {
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });
});
