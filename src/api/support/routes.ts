export const API_VERSION = 'v1';
export const API_BASE_PATH = `/api/${API_VERSION}`;

export const API_ROUTES = {
  gyms: `${API_BASE_PATH}/gym`,
  bjjEvents: `${API_BASE_PATH}/bjjevent`,
  competitions: `${API_BASE_PATH}/competition`,
  bjjEireCompetitions: `${API_BASE_PATH}/bjjeire-competition`,
  stores: `${API_BASE_PATH}/store`,
  products: `${API_BASE_PATH}/product`,
  order: `${API_BASE_PATH}/order`,
  productPhotos: `${API_BASE_PATH}/product/photo`,
  featureFlags: `${API_BASE_PATH}/featureflag`,
  localSignIn: `${API_BASE_PATH}/local-sign-in`,
  competitorMe: `${API_BASE_PATH}/competitor/me`,
  registrationMe: `${API_BASE_PATH}/registration/me`,
  registrations: `${API_BASE_PATH}/registration`,
  donateBitcoinQr: `${API_BASE_PATH}/donate/bitcoin/qr`,
  /** A route no feature owns: the baseline for what an unknown route answers. */
  noSuchFeature: `${API_BASE_PATH}/no-such-feature`,
  openApiV1: `/openapi/${API_VERSION}.json`,
} as const;

/** Paths served by the app host (`env.baseUrl`), not the API host (`env.apiUrl`). Never join these to the API URL. */
export const APP_ROUTES = {
  sitemap: '/sitemap.xml',
} as const;

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;

/** A single resource under a collection route; the id is encoded so fuzzed values stay one path segment. */
export function resourcePath(collection: string, id: string): string {
  return `${collection}/${encodeURIComponent(id)}`;
}
