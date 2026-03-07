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
// Interceptor types
// ---------------------------------------------------------------------------

/**
 * Context object passed through the interceptor chain.
 * Request interceptors can mutate headers, add tokens, attach CSRF headers, etc.
 */
export interface HttpRequestContext {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown | undefined;
  signal?: AbortSignal | undefined;
  credentials?: RequestCredentials | undefined;
}

/** Request interceptors receive the context and return a (possibly modified) context. */
export type RequestInterceptor = (
  context: HttpRequestContext,
) => HttpRequestContext | Promise<HttpRequestContext>;

/**
 * Response interceptors receive the raw Response + original context.
 * Return the Response to continue, or throw to reject.
 */
export type ResponseInterceptor = (
  response: Response,
  context: HttpRequestContext,
) => Response | Promise<Response>;

/**
 * Error interceptors receive the error + original context.
 * They can recover (return a Response to retry-parse), re-throw, or transform the error.
 */
export type ErrorInterceptor = (
  error: unknown,
  context: HttpRequestContext,
) => Response | Promise<Response>;

// ---------------------------------------------------------------------------
// Client configuration
// ---------------------------------------------------------------------------

/** Default request timeout in milliseconds (30 seconds). */
const DEFAULT_TIMEOUT_MS = 30_000;

export interface HttpClientConfig {
  /** Base URL prepended to every request endpoint. */
  baseUrl: string;
  /** Default request timeout in milliseconds. Set to 0 to disable. */
  defaultTimeout?: number;
  /** Include cookies in cross-origin requests (required for httpOnly refresh cookies). */
  credentials?: RequestCredentials;
  /** Request interceptors — executed in order before fetch. */
  requestInterceptors?: RequestInterceptor[];
  /** Response interceptors — executed in order after a successful fetch. */
  responseInterceptors?: ResponseInterceptor[];
  /** Error interceptors — executed in order when fetch throws or response is non-2xx. */
  errorInterceptors?: ErrorInterceptor[];
}

// ---------------------------------------------------------------------------
// Core request
// ---------------------------------------------------------------------------
async function request<T>(
  config: HttpClientConfig,
  method: string,
  endpoint: string,
  body?: unknown,
  init?: Omit<RequestInit, 'method' | 'body'>,
): Promise<ApiResponse<T>> {
  const normalizedBase = config.baseUrl.replace(/\/$/, '');

  // Build initial request context.
  // When the body is FormData, omit Content-Type entirely so the browser can
  // set the correct multipart/form-data; boundary=... header automatically.
  const isFormData = body instanceof FormData;
  let context: HttpRequestContext = {
    url: `${normalizedBase}${endpoint}`,
    method,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      Accept: 'application/json',
      ...(init?.headers as Record<string, string> | undefined),
    },
    body,
    signal: init?.signal ?? undefined,
    credentials: config.credentials,
  };

  // Apply request interceptors sequentially
  if (config.requestInterceptors) {
    for (const interceptor of config.requestInterceptors) {
      context = await interceptor(context);
    }
  }

  // Build timeout signal — merge with caller-provided signal if present
  const timeoutMs = config.defaultTimeout ?? DEFAULT_TIMEOUT_MS;
  let signal: AbortSignal | undefined = context.signal;

  if (timeoutMs > 0 && !signal) {
    signal = AbortSignal.timeout(timeoutMs);
  } else if (timeoutMs > 0 && signal) {
    // Combine caller signal with timeout signal — abort on whichever fires first
    signal = AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]);
  }

  let response: Response;
  try {
    response = await fetch(context.url, {
      method: context.method,
      headers: context.headers,
      // Conditional spread avoids setting `body: undefined` which violates
      // exactOptionalPropertyTypes (RequestInit.body is `BodyInit | null`, not
      // `BodyInit | null | undefined`).
      ...(context.body != null
        ? { body: context.body instanceof FormData ? context.body : JSON.stringify(context.body) }
        : {}),
      ...(signal ? { signal } : {}),
      ...(context.credentials ? { credentials: context.credentials } : {}),
    });
  } catch (error: unknown) {
    // Network error or abort — run error interceptors
    if (config.errorInterceptors) {
      for (const interceptor of config.errorInterceptors) {
        try {
          response = await interceptor(error, context);
          // If an error interceptor returns a Response, break out and continue
          break;
        } catch {
          // Error interceptor chose to re-throw or failed — let it propagate
        }
      }
    }

    // If no error interceptor recovered, rethrow the original error
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    if (!response!) throw error;
  }

  // Apply response interceptors sequentially
  if (config.responseInterceptors) {
    for (const interceptor of config.responseInterceptors) {
      response = await interceptor(response, context);
    }
  }

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
  /** Add a request interceptor at runtime (e.g. after auth initialisation). */
  addRequestInterceptor: (interceptor: RequestInterceptor) => void;
  /** Add a response interceptor at runtime. */
  addResponseInterceptor: (interceptor: ResponseInterceptor) => void;
  /** Add an error interceptor at runtime. */
  addErrorInterceptor: (interceptor: ErrorInterceptor) => void;
}

/**
 * createHttpClient — factory that returns a typed fetch wrapper bound to the
 * given configuration.
 *
 * Supports request/response/error interceptors, automatic request timeout,
 * abort-signal propagation, and cookie credentials for httpOnly auth flows.
 *
 * @example
 * import { createHttpClient } from '@nimoh-digital-solutions/tast-utils';
 *
 * export const http = createHttpClient({
 *   baseUrl: import.meta.env.VITE_API_URL,
 *   credentials: 'include',
 *   requestInterceptors: [authInterceptor],
 * });
 *
 * const { data } = await http.get<User[]>('/users');
 */
export function createHttpClient(config: HttpClientConfig | string): HttpClient {
  // Accept a plain string for backwards compatibility
  const resolvedConfig: HttpClientConfig =
    typeof config === 'string'
      ? { baseUrl: config }
      : { ...config };

  // Ensure interceptor arrays are mutable copies
  resolvedConfig.requestInterceptors = [...(resolvedConfig.requestInterceptors ?? [])];
  resolvedConfig.responseInterceptors = [...(resolvedConfig.responseInterceptors ?? [])];
  resolvedConfig.errorInterceptors = [...(resolvedConfig.errorInterceptors ?? [])];

  return {
    get: <T>(endpoint: string, init?: Omit<RequestInit, 'method' | 'body'>) =>
      request<T>(resolvedConfig, 'GET', endpoint, undefined, init),

    post: <T>(endpoint: string, body?: unknown, init?: Omit<RequestInit, 'method' | 'body'>) =>
      request<T>(resolvedConfig, 'POST', endpoint, body, init),

    put: <T>(endpoint: string, body?: unknown, init?: Omit<RequestInit, 'method' | 'body'>) =>
      request<T>(resolvedConfig, 'PUT', endpoint, body, init),

    patch: <T>(endpoint: string, body?: unknown, init?: Omit<RequestInit, 'method' | 'body'>) =>
      request<T>(resolvedConfig, 'PATCH', endpoint, body, init),

    delete: <T>(endpoint: string, init?: Omit<RequestInit, 'method' | 'body'>) =>
      request<T>(resolvedConfig, 'DELETE', endpoint, undefined, init),

    addRequestInterceptor(interceptor: RequestInterceptor) {
      resolvedConfig.requestInterceptors!.push(interceptor);
    },

    addResponseInterceptor(interceptor: ResponseInterceptor) {
      resolvedConfig.responseInterceptors!.push(interceptor);
    },

    addErrorInterceptor(interceptor: ErrorInterceptor) {
      resolvedConfig.errorInterceptors!.push(interceptor);
    },
  };
}
