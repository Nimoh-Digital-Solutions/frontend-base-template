# @nimoh-digital-solutions/tast-hooks

Reusable React hooks for the TAST ecosystem. Zero-config, SSR-safe, and fully typed.

[![npm](https://img.shields.io/npm/v/@nimoh-digital-solutions/tast-hooks)](https://www.npmjs.com/package/@nimoh-digital-solutions/tast-hooks)

## Installation

```bash
npm install @nimoh-digital-solutions/tast-hooks
# or
yarn add @nimoh-digital-solutions/tast-hooks
```

### Peer dependencies

| Package | Version |
|---|---|
| `react` | `^18 \|\| ^19` |

## Hooks

### `useLocalStorage<T>(key, initialValue)`

`useState` that persists to `localStorage`. Handles SSR, quota errors, and JSON serialization automatically.

```tsx
const [theme, setTheme, writeError] = useLocalStorage('theme', 'light');
```

| Parameter | Type | Description |
|---|---|---|
| `key` | `string` | localStorage key |
| `initialValue` | `T` | Fallback value if key is missing |

Returns `[value, setValue, writeError]` — `writeError` is a string if the last write failed (e.g. quota exceeded).

---

### `useDebounce<T>(value, delay)`

Debounces a rapidly changing value. Useful for search inputs, resize handlers, etc.

```tsx
const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 300);

useEffect(() => {
  fetchResults(debouncedSearch);
}, [debouncedSearch]);
```

---

### `useDocumentTitle(title, appName?)`

Sets `document.title` and restores it on unmount. Announces the title change to screen readers via an `aria-live` region.

```tsx
useDocumentTitle('Dashboard');
// → document.title = "Dashboard — My App"
```

---

### `useMediaQuery(query)`

Reactive CSS media query match. SSR-safe (returns `false` on the server).

```tsx
const isMobile = useMediaQuery('(max-width: 768px)');
const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
```

---

### `useClickOutside<T>(ref, handler)`

Fires a callback when a `pointerdown` event occurs outside the referenced element. Ideal for closing dropdowns and modals.

```tsx
const menuRef = useRef<HTMLDivElement>(null);
useClickOutside(menuRef, () => setOpen(false));
```

---

### `useWindowSize()`

Live window dimensions, debounced at 100 ms. SSR-safe (returns `0 × 0` on the server).

```tsx
const { width, height } = useWindowSize();
```

Returns `WindowSize` — `{ width: number; height: number }`.

---

### `usePrevious<T>(value)`

Returns the value from the previous render.

```tsx
const prevCount = usePrevious(count);
```

---

### `useToggle(initial?)`

Boolean state with memoized helpers.

```tsx
const [isOpen, toggle, open, close] = useToggle(false);
```

Returns `[value, toggle, setTrue, setFalse]`.

---

### `useToast()`

Manages a queue of auto-dismissing toast notifications.

```tsx
const { toasts, addToast, dismissToast } = useToast();

addToast({ message: 'Saved!', variant: 'success' });
```

| Property | Type | Description |
|---|---|---|
| `toasts` | `ToastItem[]` | Current visible toasts |
| `addToast` | `(options) => string` | Add a toast, returns its ID |
| `dismissToast` | `(id) => void` | Manually dismiss a toast |

---

### `useNetworkStatus()` / `useIsOnline()`

Reactive online/offline detection using `useSyncExternalStore`.

```tsx
const { isOnline, since } = useNetworkStatus();
const isOnline = useIsOnline(); // shorthand boolean
```

## TypeScript

All hooks export their associated types:

```tsx
import type { WindowSize, ToastItem, ToastVariant, NetworkStatus } from '@nimoh-digital-solutions/tast-hooks';
```

## Development

This package lives in the [TAST monorepo](https://github.com/Nimoh-Digital-Solutions/frontend-base-template).

```bash
yarn packages:build   # Build all packages
yarn test             # Run tests (Vitest)
```

## License

MIT
