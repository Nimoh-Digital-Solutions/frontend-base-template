// Test utilities barrel — import from '@test' in test files
export { renderWithProviders } from './renderWithProviders';
export type { RenderWithProvidersOptions } from './renderWithProviders';
export {
  buildPaginatedResponse,
  buildUser,
  nextId,
  resetIdCounter,
} from './factories';
export type { PaginatedResponse } from './factories';
export { server } from './mocks/server';
export {
  handlers,
  TEST_ACCESS_TOKEN,
  TEST_CSRF_TOKEN,
  TEST_USER,
} from './mocks/handlers';
