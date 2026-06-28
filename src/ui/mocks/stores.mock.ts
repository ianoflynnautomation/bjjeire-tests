import type { Page } from '@playwright/test';
import { mockJsonResponse } from './json-response.mock';

export const STORES_ROUTE = /\/api\/v[12]\/store(?:\?|$)/i;

export async function mockStores(page: Page, body: unknown): Promise<void> {
  await mockJsonResponse(page, STORES_ROUTE, body);
}
