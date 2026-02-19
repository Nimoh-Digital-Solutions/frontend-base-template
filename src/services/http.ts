import { APP_CONFIG } from '@configs';
import type { ApiResponse } from '@types';

// ---------------------------------------------------------------------------
// HTTP Error
// ---------------------------------------------------------------------------
/**
 * HttpError — thrown when a response has a non-2xx status code.
 * Carries the status code and parsed response body for upstream handling.
 *
 * @example
 * try {
 *   await http.get('/users');
 * } catch (err) {
 *   if (err instanceof HttpError && err.status === 401) {
 *     // redirect to login
 *   }
 * }
 */
export class HttpError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown) {
    super(`HTTP Error ${status}`);
    this.name = 'HttpError';
    this.status = status;
    this.body = body;
  }
}

// ---------------------------------------------------------------------------
// Core request
// ---------------------------------------------------------------------------
async function request<T>(
  method: string,
  endpoint: string,
  body?: unknown,
  init?: Omit<RequestInit, 'method' | 'body'>,
): Promise<ApiResponse<T>> {
  const baseUrl = (APP_CONFIG.apiUrl ?? '').replace(/\/$/, '');
  const url = `${baseUrl}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...init?.headers,
    },
    // Conditional spread avoids setting `body: undefined` which violates
    // exactOptionalPropertyTypes (RequestInit.body is `BodyInit | null`, not
    // `BodyInit | null | undefined`).
    ...(body != null ? { body: JSON.stringify(body) } : {}),
    ...init,
  });

  // Parse JSON body — fall back to null if the response has no body (e.g. 204)
  const json: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new HttpError(response.status, json);
  }

  return {
    data: json as T,
    status: response.status,
    message: response.statusText,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
// CSRF NOTE: Once session-cookie authentication is wired in, every mutating
// request (POST / PUT / PATCH / DELETE) must include a CSRF token header,
// e.g. 'X-CSRF-Token': getCsrfToken().  The `init` spread in `request()`
// already supports custom headers, but the token extraction helper and the
// cookie-to-header wiring are intentionally left out of this template.
/**
 * http — lightweight typed fetch wrapper.
 *
 * All methods read `APP_CONFIG.apiUrl` as the base URL and return a
 * typed `ApiResponse<T>`. Non-2xx responses throw `HttpError`.
 *
 * @example
 * import { http } from '@services';
 *
 * const { data } = await http.get<User[]>('/users');
 * await http.post<User>('/users', { name: 'Alice' });
 * await http.delete('/users/1');
 */
export const http = {
  get: <T>(endpoint: string, init?: Omit<RequestInit, 'method' | 'body'>) =>
    request<T>('GET', endpoint, undefined, init),

  post: <T>(endpoint: string, body?: unknown, init?: Omit<RequestInit, 'method' | 'body'>) =>
    request<T>('POST', endpoint, body, init),

  put: <T>(endpoint: string, body?: unknown, init?: Omit<RequestInit, 'method' | 'body'>) =>
    request<T>('PUT', endpoint, body, init),

  patch: <T>(endpoint: string, body?: unknown, init?: Omit<RequestInit, 'method' | 'body'>) =>
    request<T>('PATCH', endpoint, body, init),

  delete: <T>(endpoint: string, init?: Omit<RequestInit, 'method' | 'body'>) =>
    request<T>('DELETE', endpoint, undefined, init),
};
