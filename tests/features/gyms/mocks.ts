import type { Page } from '@playwright/test';
import { gymsPageSchema } from '@api/features/gyms/gyms.schemas';
import type { GymDto } from '@api/features/gyms/gyms.types';
import { API_ROUTES, DEFAULT_PAGE_SIZE } from '@api/support';
import { MAP_TILE_URL_PATTERN } from '@ui/pages/gyms/gyms.constants';
import { mockJsonResponse, parseMockBody } from '@ui/mocks/json-response.mock';
import { paginatePages } from '@ui/mocks/paginate.mock';

export const GYMS_ROUTE = /\/api\/v[12]\/gym(?:\?|$)/i;

export async function mockGyms(page: Page, body: unknown): Promise<void> {
  await mockJsonResponse(page, GYMS_ROUTE, parseMockBody(gymsPageSchema, body, 'gyms'));
}

/** Answers every request as the API would: filtered by county and sliced to the requested page. */
export async function mockGymDirectory(page: Page, gyms: readonly GymDto[]): Promise<void> {
  await page.route(GYMS_ROUTE, route => {
    const { searchParams } = new URL(route.request().url());
    const county = searchParams.get('county');
    const pageSize = Number(searchParams.get('pageSize') ?? DEFAULT_PAGE_SIZE);
    const matching = county ? gyms.filter(gym => gym.county === county) : gyms;
    const body = paginatePages(matching, pageSize, API_ROUTES.gyms)[Number(searchParams.get('page') ?? 1)];
    return route.fulfill({ json: parseMockBody(gymsPageSchema, body, 'gyms') });
  });
}

/** A valid 1x1 PNG (a faint blue pixel, not transparent): what every map tile is answered with. Tiles are never compared. */
const BLANK_TILE = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

/** Keeps map specs off live OpenStreetMap. A route registered later wins, so a spec may abort tiles after this. */
export async function mockMapTiles(page: Page): Promise<void> {
  await page.route(MAP_TILE_URL_PATTERN, route => route.fulfill({ contentType: 'image/png', body: BLANK_TILE }));
}

/** Fails every tile request, so the map's tile-error path runs. Registered after `mockMapTiles` it takes over; no tile reaches the network. */
export async function abortMapTiles(page: Page): Promise<void> {
  await page.route(MAP_TILE_URL_PATTERN, route => route.abort('failed'));
}
