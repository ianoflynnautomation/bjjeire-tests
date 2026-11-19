import type { Page } from '@playwright/test';
import { bjjEventsPageSchema } from '@api/features/events/events.schemas';
import { EVENTS_LIST_API_ROUTE } from '@ui/pages/events/events.constants';
import type { BjjEventDto } from '@api/features/events/events.types';
import { pagedEventsResponse } from './testdata/multi-page';
import { mockJsonResponse, parseMockBody } from '@ui/mocks/json-response.mock';

export const EVENTS_ROUTE = EVENTS_LIST_API_ROUTE;

export async function mockBjjEvents(page: Page, body: unknown): Promise<void> {
  await mockJsonResponse(page, EVENTS_ROUTE, parseMockBody(bjjEventsPageSchema, body, 'events'));
}

/**
 * Answers every events list request from `events`, read from the request: `page`, `pageSize`, `county` and `types`.
 * The app asks for `page=N&pageSize=20`; search and the map ask for `page=1&pageSize=100`.
 */
export async function mockBjjEventsPaged(page: Page, events: readonly BjjEventDto[]): Promise<void> {
  await page.route(EVENTS_ROUTE, async route => {
    const params = new URL(route.request().url()).searchParams;
    const body = parseMockBody(bjjEventsPageSchema, pagedEventsResponse(events, params), 'events (paged)');
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
}

export { mockMapTiles, abortMapTiles } from '@ui/mocks/map-tiles.mock';
