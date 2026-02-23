import { useRef, useEffect } from 'react';

/**
 * usePrevious
 *
 * Returns the value from the previous render. On the first render it returns
 * `undefined`. Useful for diffing values in effects or triggering animations
 * when a prop changes.
 *
 * @example
 * const prevCount = usePrevious(count);
 * // prevCount is undefined on first render, then lags one render behind
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  // Run after every render so `ref.current` always holds the *previous* value
  // when the consumer reads it during the current render.
  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
}
