import type { Page, Route } from '@playwright/test';

export type MockRoute = string | RegExp;

const SERVER_ERROR = 500;

function fulfillProblem(route: Route, status: number): Promise<void> {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify({ type: 'about:blank', title: 'Internal Server Error', status }),
  });
}

export async function mockNetworkError(page: Page, route: MockRoute): Promise<void> {
  await page.route(route, handler => handler.abort('failed'));
}

export async function mockServerError(page: Page, route: MockRoute, status = SERVER_ERROR): Promise<void> {
  await page.route(route, handler => fulfillProblem(handler, status));
}

export async function mockServerErrorOnce(page: Page, route: MockRoute, status = SERVER_ERROR): Promise<void> {
  await page.route(route, handler => fulfillProblem(handler, status), { times: 1 });
}
