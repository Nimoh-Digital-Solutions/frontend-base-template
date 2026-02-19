import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { debounce, throttle, generateId, isEmpty, deepClone } from './helpers';

describe('helpers', () => {
  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it('delays function execution', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 500);

      debouncedFn('test');
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(499);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(fn).toHaveBeenCalledWith('test');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('cancels previous calls on rapid invocation', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 500);

      debouncedFn('first');
      vi.advanceTimersByTime(200);
      debouncedFn('second');
      vi.advanceTimersByTime(200);
      debouncedFn('third');

      vi.advanceTimersByTime(500);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('third');
    });

    it('handles multiple arguments', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn('arg1', 'arg2', 'arg3');
      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it('executes immediately on first call', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 500);

      throttledFn('test');
      expect(fn).toHaveBeenCalledWith('test');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('prevents execution within throttle period', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 500);

      throttledFn('first');
      throttledFn('second');
      throttledFn('third');

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('first');
    });

    it('allows execution after throttle period', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 500);

      throttledFn('first');
      vi.advanceTimersByTime(500);
      throttledFn('second');

      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenNthCalledWith(1, 'first');
      expect(fn).toHaveBeenNthCalledWith(2, 'second');
    });
  });

  describe('generateId', () => {
    it('generates a string', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('generates IDs of consistent length (default 9)', () => {
      const ids = Array.from({ length: 25 }, () => generateId());
      expect(ids.every(id => id.length === 9)).toBe(true);
    });

    it('supports custom length', () => {
      expect(generateId(4)).toHaveLength(4);
      expect(generateId(16)).toHaveLength(16);
    });

    it('is very likely to generate unique IDs', () => {
      const ids = Array.from({ length: 500 }, () => generateId());
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });
  });

  describe('isEmpty', () => {
    it('returns true for null / undefined', () => {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
    });

    it('returns true for empty strings', () => {
      expect(isEmpty('')).toBe(true);
      expect(isEmpty('   ')).toBe(true);
    });

    it('returns true for empty arrays', () => {
      expect(isEmpty([])).toBe(true);
    });

    it('returns true for empty objects', () => {
      expect(isEmpty({})).toBe(true);
    });

    it('returns true for empty Map/Set', () => {
      expect(isEmpty(new Map())).toBe(true);
      expect(isEmpty(new Set())).toBe(true);
    });

    it('returns false for non-empty string/array/object', () => {
      expect(isEmpty('hello')).toBe(false);
      expect(isEmpty([1])).toBe(false);
      expect(isEmpty({ key: 'value' })).toBe(false);
    });

    it('returns false for numbers/booleans', () => {
      expect(isEmpty(0)).toBe(false);
      expect(isEmpty(42)).toBe(false);
      expect(isEmpty(false)).toBe(false);
      expect(isEmpty(true)).toBe(false);
    });

    it('returns false for non-empty Map/Set', () => {
      expect(isEmpty(new Map([['a', 1]]))).toBe(false);
      expect(isEmpty(new Set([1]))).toBe(false);
    });
  });

  describe('deepClone', () => {
    it('clones primitive values', () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone('hello')).toBe('hello');
      expect(deepClone(true)).toBe(true);
      expect(deepClone(null)).toBe(null);
    });

    it('clones arrays', () => {
      const original = [1, 2, 3];
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);

      cloned.push(4);
      expect(original).toHaveLength(3);
      expect(cloned).toHaveLength(4);
    });

    it('clones objects', () => {
      const original = { a: 1, b: 2 };
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);

      cloned.a = 999;
      expect(original.a).toBe(1);
    });

    it('clones nested objects', () => {
      const original = { a: 1, b: { c: 2, d: { e: 3 } } };
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
      expect(cloned.b.d).not.toBe(original.b.d);

      cloned.b.d.e = 999;
      expect(original.b.d.e).toBe(3);
    });

    it('clones Date objects', () => {
      const original = new Date('2024-01-01');
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.getTime()).toBe(original.getTime());
    });

    it('clones mixed structures', () => {
      const original = {
        name: 'test',
        count: 42,
        active: true,
        tags: ['a', 'b', 'c'],
        metadata: {
          created: new Date('2024-01-01'),
          nested: { value: 123 },
        },
      };

      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.tags).not.toBe(original.tags);
      expect(cloned.metadata).not.toBe(original.metadata);
      expect(cloned.metadata.created).not.toBe(original.metadata.created);
    });
  });
});
