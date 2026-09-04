export const API_VERSION = 'v1';
export const API_BASE_PATH = `/api/${API_VERSION}`;

export const API_ROUTES = {
  gyms: `${API_BASE_PATH}/gym`,
  bjjEvents: `${API_BASE_PATH}/bjjevent`,
  competitions: `${API_BASE_PATH}/competition`,
  stores: `${API_BASE_PATH}/store`,
  donateBitcoinQr: `${API_BASE_PATH}/donate/bitcoin/qr`,
  openApiV1: `/openapi/${API_VERSION}.json`,
} as const;

export function withRouteId(route: string, id: string): string {
  return `${route}/${id}`;
}

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MIN_PAGE_SIZE = 1;
export const MAX_PAGE_SIZE = 100;
