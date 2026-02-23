import { type RefObject, useEffect } from 'react';

/**
 * useClickOutside
 *
 * Fires `handler` whenever the user clicks (pointerdown) outside of `ref`.
 * Use it to close dropdowns, modals, and context menus.
 *
 * The `handler` reference should be stable (wrap in useCallback) to avoid
 * reattaching the event listener on every render.
 *
 * @example
 * const ref = useRef<HTMLDivElement>(null);
 * useClickOutside(ref, () => setOpen(false));
 */
export function useClickOutside<T extends Element>(
  ref: RefObject<T | null>,
  handler: (event: PointerEvent) => void
): void {
  useEffect(() => {
    const listener = (event: PointerEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) return;
      handler(event);
    };

    document.addEventListener('pointerdown', listener);
    return () => document.removeEventListener('pointerdown', listener);
  }, [ref, handler]);
}

