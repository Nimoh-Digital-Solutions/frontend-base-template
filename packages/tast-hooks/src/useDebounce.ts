import { useState, useEffect } from 'react';

/**
 * useDebounce
 *
 * Returns a debounced copy of `value` that only updates after `delay` ms
 * of inactivity. Resets the timer on every render where `value` or `delay`
 * changes.
 *
 * Common use-case: defer expensive API calls until the user stops typing.
 *
 * @example
 * const debouncedSearch = useDebounce(searchTerm, 300);
 * // API call fires 300ms after the user stops typing
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
