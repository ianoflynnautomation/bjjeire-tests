import type { Page } from '@playwright/test';
import { mockJsonResponse } from './json-response.mock';

export const COMPETITIONS_ROUTE = /\/api\/v[12]\/competition(?:\?|$)/i;

export async function mockCompetitions(page: Page, body: unknown): Promise<void> {
  await mockJsonResponse(page, COMPETITIONS_ROUTE, body);
}
