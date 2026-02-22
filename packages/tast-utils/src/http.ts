import type { ApiResponse } from './types';

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
  baseUrl: string,
  method: string,
  endpoint: string,
  body?: unknown,
  init?: Omit<RequestInit, 'method' | 'body'>,
): Promise<ApiResponse<T>> {
  const normalizedBase = baseUrl.replace(/\/$/, '');
  const url = `${normalizedBase}${endpoint}`;

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

export interface HttpClient {
  get: <T>(endpoint: string, init?: Omit<RequestInit, 'method' | 'body'>) => Promise<ApiResponse<T>>;
  post: <T>(endpoint: string, body?: unknown, init?: Omit<RequestInit, 'method' | 'body'>) => Promise<ApiResponse<T>>;
  put: <T>(endpoint: string, body?: unknown, init?: Omit<RequestInit, 'method' | 'body'>) => Promise<ApiResponse<T>>;
  patch: <T>(endpoint: string, body?: unknown, init?: Omit<RequestInit, 'method' | 'body'>) => Promise<ApiResponse<T>>;
  delete: <T>(endpoint: string, init?: Omit<RequestInit, 'method' | 'body'>) => Promise<ApiResponse<T>>;
}

/**
 * createHttpClient — factory that returns a lightweight typed fetch wrapper
 * bound to the given `baseUrl`.
 *
 * All methods return a typed `ApiResponse<T>`. Non-2xx responses throw `HttpError`.
 *
 * @example
 * import { createHttpClient } from '@nimoh-digital-solutions/tast-utils';
 *
 * export const http = createHttpClient(import.meta.env.VITE_API_URL);
 *
 * const { data } = await http.get<User[]>('/users');
 * await http.post<User>('/users', { name: 'Alice' });
 * await http.delete('/users/1');
 */
export function createHttpClient(baseUrl: string): HttpClient {
  return {
    get: <T>(endpoint: string, init?: Omit<RequestInit, 'method' | 'body'>) =>
      request<T>(baseUrl, 'GET', endpoint, undefined, init),

    post: <T>(endpoint: string, body?: unknown, init?: Omit<RequestInit, 'method' | 'body'>) =>
      request<T>(baseUrl, 'POST', endpoint, body, init),

    put: <T>(endpoint: string, body?: unknown, init?: Omit<RequestInit, 'method' | 'body'>) =>
      request<T>(baseUrl, 'PUT', endpoint, body, init),

    patch: <T>(endpoint: string, body?: unknown, init?: Omit<RequestInit, 'method' | 'body'>) =>
      request<T>(baseUrl, 'PATCH', endpoint, body, init),

    delete: <T>(endpoint: string, init?: Omit<RequestInit, 'method' | 'body'>) =>
      request<T>(baseUrl, 'DELETE', endpoint, undefined, init),
  };
}
