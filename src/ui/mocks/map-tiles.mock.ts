import type { Page } from '@playwright/test';
import { MAP_TILE_URL_PATTERN } from '@ui/pages/common/map.constants';

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
