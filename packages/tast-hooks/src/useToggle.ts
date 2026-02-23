import { useState, useCallback } from 'react';

/**
 * useToggle
 *
 * Manages a boolean state with convenient helpers to toggle, set true,
 * or set false without inline callbacks scattered across JSX.
 *
 * Returns a stable tuple — all callbacks are memoised and will not change
 * between renders unless `initial` changes (which it never should in practice).
 *
 * @example
 * const [isOpen, toggle, open, close] = useToggle();
 * <button onClick={toggle}>Menu</button>
 * <button onClick={close}>Close</button>
 */
export function useToggle(initial = false): [boolean, () => void, () => void, () => void] {
  const [value, setValue] = useState(initial);

  const toggle = useCallback(() => setValue(v => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);

  return [value, toggle, setTrue, setFalse];
}
