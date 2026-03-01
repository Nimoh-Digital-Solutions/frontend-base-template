import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSpinner, type Spinner } from '../spinner.js';

describe('createSpinner', () => {
  let writeSpy: ReturnType<typeof vi.spyOn>;
  let clearIntervalSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    writeSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    clearIntervalSpy = vi.spyOn(global, 'clearInterval');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('writes the first frame immediately', () => {
    createSpinner('Loading');
    // Immediate write on creation
    expect(writeSpy).toHaveBeenCalledTimes(1);
    expect(writeSpy.mock.calls[0]![0]).toContain('Loading');
    expect(writeSpy.mock.calls[0]![0]).toContain('⠋');
  });

  it('animates through frames on interval', () => {
    createSpinner('Working');
    // Initial write
    expect(writeSpy).toHaveBeenCalledTimes(1);

    // Advance one interval tick
    vi.advanceTimersByTime(80);
    expect(writeSpy).toHaveBeenCalledTimes(2);
    expect(writeSpy.mock.calls[1]![0]).toContain('Working');
  });

  describe('succeed()', () => {
    it('clears interval and writes success mark', () => {
      const spinner = createSpinner('Test');
      writeSpy.mockClear();

      spinner.succeed('Done!');
      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(writeSpy).toHaveBeenCalledTimes(1);
      expect(writeSpy.mock.calls[0]![0]).toContain('✓');
      expect(writeSpy.mock.calls[0]![0]).toContain('Done!');
    });

    it('uses default text when no message provided', () => {
      const spinner = createSpinner('Default text');
      writeSpy.mockClear();

      spinner.succeed();
      expect(writeSpy.mock.calls[0]![0]).toContain('Default text');
    });
  });

  describe('fail()', () => {
    it('clears interval and writes failure mark', () => {
      const spinner = createSpinner('Test');
      writeSpy.mockClear();

      spinner.fail('Error!');
      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(writeSpy).toHaveBeenCalledTimes(1);
      expect(writeSpy.mock.calls[0]![0]).toContain('✗');
      expect(writeSpy.mock.calls[0]![0]).toContain('Error!');
    });
  });

  describe('stop()', () => {
    it('clears interval and clears the line', () => {
      const spinner = createSpinner('Test');
      writeSpy.mockClear();

      spinner.stop();
      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(writeSpy).toHaveBeenCalledTimes(1);
      // Should clear the line with \r\x1b[K
      expect(writeSpy.mock.calls[0]![0]).toBe('\r\x1b[K');
    });
  });
});
