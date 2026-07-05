import type { Page } from '@playwright/test';
import { storesPageSchema } from '@api/features/stores/stores.schemas';
import { mockJsonResponse, parseMockBody } from './json-response.mock';

export const STORES_ROUTE = /\/api\/v[12]\/store(?:\?|$)/i;

export async function mockStores(page: Page, body: unknown): Promise<void> {
  await mockJsonResponse(page, STORES_ROUTE, parseMockBody(storesPageSchema, body, 'stores'));
}
