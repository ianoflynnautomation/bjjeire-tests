export const API_VERSION = 'v1';
export const API_BASE_PATH = `/api/${API_VERSION}`;

export const API_ROUTES = {
  gyms: `${API_BASE_PATH}/gym`,
  gymsV2: '/api/v2/gym',
  bjjEvents: `${API_BASE_PATH}/bjjevent`,
  competitions: `${API_BASE_PATH}/competition`,
  stores: `${API_BASE_PATH}/store`,
  featureFlags: `${API_BASE_PATH}/featureflag`,
  featureFlagsPascal: `${API_BASE_PATH}/FeatureFlag`,
  template: `${API_BASE_PATH}/template`,
  donateBitcoinQr: `${API_BASE_PATH}/donate/bitcoin/qr`,
  openApiV1: '/openapi/v1.json',
  scalarV1: '/scalar/v1',
  health: '/health',
  metrics: '/metrics',
} as const;

export function withRouteId(route: string, id: string): string {
  return `${route}/${id}`;
}
