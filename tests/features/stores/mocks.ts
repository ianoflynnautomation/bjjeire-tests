import type { Page } from '@playwright/test';
import { storesPageSchema } from '@api/features/stores/stores.schemas';
import { problemDetailSchema } from '@api/support';
import { PRODUCTS_ROUTE } from '@ui/pages/stores/stores.constants';
import { mockJsonResponse, parseMockBody } from '@ui/mocks/json-response.mock';

export const STORES_ROUTE = /\/api\/v[12]\/store(?:\?|$)/i;

export async function mockStores(page: Page, body: unknown): Promise<void> {
  await mockJsonResponse(page, STORES_ROUTE, parseMockBody(storesPageSchema, body, 'stores'));
}

const SERVER_PROBLEM = {
  type: 'urn:bjjeire:internal-error',
  title: 'Internal Server Error',
  status: 500,
  detail: 'The merch catalogue could not be read.',
  instance: '/api/v1/product',
  traceId: '00000000000000000000000000000000',
};

export async function mockProductsServerError(page: Page): Promise<void> {
  const problem = parseMockBody(problemDetailSchema, SERVER_PROBLEM, 'product server problem');
  await page.route(PRODUCTS_ROUTE, route =>
    route.fulfill({ status: problem.status, contentType: 'application/problem+json', body: JSON.stringify(problem) }),
  );
}
