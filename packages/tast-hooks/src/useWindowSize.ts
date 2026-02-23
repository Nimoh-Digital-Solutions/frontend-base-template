import { useState, useEffect } from 'react';

export interface WindowSize {
  width: number;
  height: number;
}

/**
 * useWindowSize
 *
 * Returns the current `window.innerWidth` and `window.innerHeight`, updated
 * on every `resize` event (debounced by 100 ms to avoid thrashing).
 * SSR-safe: returns `{ width: 0, height: 0 }` when `window` is unavailable.
 *
 * @example
 * const { width } = useWindowSize();
 * const isMobile = width < 768;
 */
export function useWindowSize(): WindowSize {
  const [size, setSize] = useState<WindowSize>(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  }));

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setSize({ width: window.innerWidth, height: window.innerHeight });
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  return size;
}
