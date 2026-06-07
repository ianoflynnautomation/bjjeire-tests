import type { HttpMethod } from '@api/support';
import { API_ROUTES, withRouteId } from '@api/support';

const knownId = '507f1f77bcf86cd799439011';

/** All public GET routes. Used by headers, data-exposure, CORS, and injection specs. */
export const PUBLIC_ROUTES: readonly string[] = [
  API_ROUTES.gyms,
  API_ROUTES.bjjEvents,
  API_ROUTES.competitions,
  API_ROUTES.stores,
  API_ROUTES.featureFlags,
  API_ROUTES.donateBitcoinQr,
];

/** Subset of PUBLIC_ROUTES that return paginated collections and support query filtering. */
export const COLLECTION_ROUTES: readonly string[] = [
  API_ROUTES.gyms,
  API_ROUTES.bjjEvents,
  API_ROUTES.competitions,
  API_ROUTES.stores,
  API_ROUTES.featureFlags,
];

/** Routes that accept an `/:id` suffix for single-resource lookup. */
export const PUBLIC_ROUTES_WITH_IDS: readonly string[] = [
  API_ROUTES.gyms,
  API_ROUTES.bjjEvents,
  API_ROUTES.competitions,
  API_ROUTES.stores,
];

/** Map of route to its known query parameters (for injection fuzzing). */
export const ALL_QUERY_PARAMS: ReadonlyMap<string, readonly string[]> = new Map([
  [API_ROUTES.gyms, ['county', 'page', 'pageSize']],
  [API_ROUTES.bjjEvents, ['page', 'pageSize']],
  [API_ROUTES.competitions, ['page', 'pageSize']],
  [API_ROUTES.stores, ['page', 'pageSize']],
  [API_ROUTES.featureFlags, []],
]);

export type WriteCase = Readonly<{ method: HttpMethod; path: string }>;

/** Write endpoints used by read-only enforcement and auth bypass tests. */
export const WRITE_ENDPOINTS: readonly WriteCase[] = [
  { method: 'POST', path: API_ROUTES.gyms },
  { method: 'PUT', path: API_ROUTES.gyms },
  { method: 'DELETE', path: withRouteId(API_ROUTES.gyms, knownId) },
  { method: 'POST', path: API_ROUTES.bjjEvents },
  { method: 'PUT', path: API_ROUTES.bjjEvents },
  { method: 'DELETE', path: withRouteId(API_ROUTES.bjjEvents, knownId) },
];
