import type { Page } from '@playwright/test';
import { bjjEventsPageSchema } from '@api/features/events/events.schemas';
import { mockJsonResponse, parseMockBody } from './json-response.mock';

export const EVENTS_ROUTE = /\/api\/v[12]\/bjjevent(?:\?|$)/i;

export async function mockBjjEvents(page: Page, body: unknown): Promise<void> {
  await mockJsonResponse(page, EVENTS_ROUTE, parseMockBody(bjjEventsPageSchema, body, 'events'));
}
