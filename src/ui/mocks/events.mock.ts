import type { Page } from '@playwright/test';
import { mockJsonResponse } from './json-response.mock';

const EVENTS_ROUTE = /\/api\/v[12]\/bjjevent(?:\?|$)/i;

export async function mockBjjEvents(page: Page, body: unknown): Promise<void> {
  await mockJsonResponse(page, EVENTS_ROUTE, body);
}
