import { createHttpClient } from '@nimoh-digital-solutions/tast-utils';
import { APP_CONFIG } from '@configs';

// Re-export HttpError so import sites that catch it don't need a separate
// import from @nimoh-digital-solutions/tast-utils.
export { HttpError } from '@nimoh-digital-solutions/tast-utils';

// CSRF NOTE: Once session-cookie authentication is wired in, every mutating
// request (POST / PUT / PATCH / DELETE) must include a CSRF token header,
// e.g. 'X-CSRF-Token': getCsrfToken(). The createHttpClient factory's `init`
// spread already supports custom headers for this purpose.
/**
 * http — pre-configured fetch wrapper pointing at APP_CONFIG.apiUrl.
 *
 * Built from the `createHttpClient()` factory in @nimoh-digital-solutions/tast-utils.
 * Non-2xx responses throw `HttpError`.
 *
 * @example
 * import { http } from '@services';
 *
 * const { data } = await http.get<User[]>('/users');
 * await http.post<User>('/users', { name: 'Alice' });
 * await http.delete('/users/1');
 */
export const http = createHttpClient(APP_CONFIG.apiUrl ?? '');
