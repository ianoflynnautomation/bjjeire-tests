import type { Page } from '@playwright/test';
import { COMPETITIONS_ROUTE } from './competitions.mock';
import { EVENTS_ROUTE } from './events.mock';
import { GYMS_ROUTE } from './gyms.mock';
import { STORES_ROUTE } from './stores.mock';

const ROUTES = {
  competitions: COMPETITIONS_ROUTE,
  events: EVENTS_ROUTE,
  gyms: GYMS_ROUTE,
  stores: STORES_ROUTE,
} as const;

export type ApiResource = keyof typeof ROUTES;

export async function mockNetworkError(page: Page, resource: ApiResource): Promise<void> {
  await page.route(ROUTES[resource], route => route.abort('failed'));
}

export async function mockServerError(page: Page, resource: ApiResource, status = 500): Promise<void> {
  await page.route(ROUTES[resource], route =>
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ type: 'about:blank', title: 'Internal Server Error', status }),
    }),
  );
}

export async function mockServerErrorOnce(page: Page, resource: ApiResource, status = 500): Promise<void> {
  await page.route(
    ROUTES[resource],
    route =>
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({ type: 'about:blank', title: 'Internal Server Error', status }),
      }),
    { times: 1 },
  );
}
