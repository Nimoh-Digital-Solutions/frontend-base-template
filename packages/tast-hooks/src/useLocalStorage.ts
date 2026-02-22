import { useCallback, useState } from 'react';
import { getStorageItem, setStorageItem } from '@nimoh-digital-solutions/tast-utils';

type SetStateAction<T> = T | ((prev: T) => T);

/**
 * useLocalStorage
 *
 * A minimal hook that behaves like `useState`, but persists its value
 * to `localStorage`.
 * - Reads from `localStorage` once on initial render
 * - Stores the value in React state
 * - Writes to `localStorage` whenever the value changes
 * - Exposes `writeError` (true) when a write fails (e.g. quota exceeded)
 *
 * This hook is intentionally simple. It does not:
 * - sync across tabs
 * - react to key changes
 * - remove keys automatically
 *
 * @param key - The localStorage key
 * @param initialValue - Value used when nothing is stored
 * @returns [value, setValue, writeError]
 */
export function useLocalStorage<T>(key: string, initialValue: T): readonly [T, (next: SetStateAction<T>) => void, boolean] {
  const [value, setValue] = useState<T>(() => getStorageItem<T>(key, initialValue));
  const [writeError, setWriteError] = useState(false);

  const setStoredValue = useCallback(
    (next: SetStateAction<T>) => {
      setValue(prev => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;

        const ok = setStorageItem(key, resolved);
        setWriteError(!ok);
        return resolved;
      });
    },
    [key]
  );

  return [value, setStoredValue, writeError] as const;
}
