import type { Page } from '@playwright/test';
import { bjjEventsPageSchema } from '@api/features/events/events.schemas';
import { EVENTS_LIST_API_ROUTE } from '@ui/pages/events/events.constants';
import { mockJsonResponse, parseMockBody } from '@ui/mocks/json-response.mock';

export const EVENTS_ROUTE = EVENTS_LIST_API_ROUTE;

export async function mockBjjEvents(page: Page, body: unknown): Promise<void> {
  await mockJsonResponse(page, EVENTS_ROUTE, parseMockBody(bjjEventsPageSchema, body, 'events'));
}

export { mockMapTiles } from '@ui/mocks/map-tiles.mock';
