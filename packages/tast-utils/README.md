# @nimoh-digital-solutions/tast-utils

General-purpose utility functions, types, and an HTTP client for the TAST ecosystem. Zero runtime dependencies.

[![npm](https://img.shields.io/npm/v/@nimoh-digital-solutions/tast-utils)](https://www.npmjs.com/package/@nimoh-digital-solutions/tast-utils)

## Installation

```bash
npm install @nimoh-digital-solutions/tast-utils
# or
yarn add @nimoh-digital-solutions/tast-utils
```

No peer or runtime dependencies required.

## API reference

### HTTP client

A typed `fetch` wrapper with interceptors, configurable timeout, and credentials support.

```ts
import { createHttpClient, HttpError } from '@nimoh-digital-solutions/tast-utils';

const http = createHttpClient({
  baseUrl: 'https://api.example.com',
  timeout: 15_000,           // default: 30 000 ms
  credentials: 'include',    // send cookies
});

// Typed requests
const users = await http.get<User[]>('/users');
const user = await http.post<User>('/users', { name: 'Alice' });
await http.put<User>('/users/1', { name: 'Bob' });
await http.patch<User>('/users/1', { email: 'bob@example.com' });
await http.delete('/users/1');
```

#### Interceptors

```ts
// Add auth header to every request
http.addRequestInterceptor(async (ctx) => {
  ctx.headers.set('Authorization', `Bearer ${getToken()}`);
  return ctx;
});

// Handle 401 globally
http.addErrorInterceptor(async (error) => {
  if (error instanceof HttpError && error.status === 401) {
    await refreshToken();
    // retry…
  }
  throw error;
});
```

#### `HttpError`

Thrown on non-2xx responses. Exposes `status` and `body` properties.

```ts
try {
  await http.get('/protected');
} catch (err) {
  if (err instanceof HttpError) {
    console.log(err.status); // 403
    console.log(err.body);   // parsed JSON body
  }
}
```

---

### Formatters

```ts
import { formatDate, truncateString, capitalize } from '@nimoh-digital-solutions/tast-utils';

formatDate(new Date());                              // "Feb 28, 2026"
formatDate(new Date(), { dateStyle: 'full' }, 'fr'); // "samedi 28 février 2026"
truncateString('Hello world', 8);                    // "Hello…"
truncateString('Hello world', 8, '...');             // "Hello..."
capitalize('hello');                                 // "Hello"
```

---

### Helpers

```ts
import { debounce, throttle, generateId, isEmpty, deepClone } from '@nimoh-digital-solutions/tast-utils';
```

| Function | Signature | Description |
|---|---|---|
| `debounce(fn, wait)` | `(fn, ms) => DebouncedFn` | Debounce with `.cancel()` method |
| `throttle(fn, limit)` | `(fn, ms) => ThrottledFn` | Leading-edge throttle |
| `generateId(length?)` | `(n?) => string` | Random ID via `crypto.randomUUID` (fallback: `Math.random`) |
| `isEmpty(value)` | `(v) => boolean` | Null/empty check for strings, arrays, objects, Maps, Sets |
| `deepClone<T>(obj)` | `(obj) => T` | Deep clone via `structuredClone` (manual fallback) |

---

### Storage

Safe `localStorage` wrappers that never throw. Sensitive keys (`token`, `secret`, `password`, `auth`) are blocked from being written.

```ts
import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  clearStorage,
  hasStorageItem,
} from '@nimoh-digital-solutions/tast-utils';

setStorageItem('user', { id: '1', name: 'Alice' });
const user = getStorageItem<User>('user');         // User | null
const exists = hasStorageItem('user');              // true
removeStorageItem('user');
clearStorage();
```

---

### PWA utilities

Comprehensive Progressive Web App helpers.

```ts
import {
  registerPWAInstallPromptListener,
  canPromptPWAInstall,
  promptPWAInstall,
  isPWA,
  getDisplayMode,
  isIOS,
  isAndroid,
  supportsServiceWorker,
  getConnectionType,
  isSlowConnection,
  getAppVersionFromSW,
} from '@nimoh-digital-solutions/tast-utils';

// Capture the install prompt event
registerPWAInstallPromptListener();

// Check and trigger install
if (canPromptPWAInstall()) {
  const result = await promptPWAInstall(); // 'accepted' | 'dismissed' | null
}

// Platform & mode detection
isPWA();                  // true if running as installed PWA
getDisplayMode();         // 'standalone' | 'browser' | ...
isIOS();                  // handles iPadOS
isSlowConnection();       // true on 2G/slow-2G
```

---

### Types

Reusable TypeScript types for API responses and app patterns:

```ts
import type {
  ApiResponse,
  PaginatedResponse,
  ProblemDetail,         // RFC 7807
  Theme,
  DisplayMode,
  ConnectionType,
  PWAConfig,
  WorkboxConfig,
} from '@nimoh-digital-solutions/tast-utils';
```

## Development

This package lives in the [TAST monorepo](https://github.com/Nimoh-Digital-Solutions/frontend-base-template).

```bash
yarn packages:build   # Build all packages
yarn test             # Run tests (Vitest)
```

## License

MIT
