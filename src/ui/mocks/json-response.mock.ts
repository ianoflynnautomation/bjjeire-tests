import type { Page } from '@playwright/test';

export async function mockJsonResponse(page: Page, urlPattern: string | RegExp, body: unknown): Promise<void> {
  await page.route(urlPattern, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
}

export async function mockPagedJsonResponse(
  page: Page,
  urlPattern: string | RegExp,
  bodiesByPage: Readonly<Record<number, unknown>>,
): Promise<void> {
  await page.route(urlPattern, async route => {
    const requestedPage = Number(new URL(route.request().url()).searchParams.get('page') ?? '1');
    const body = bodiesByPage[requestedPage];
    await route.fulfill({
      status: body === undefined ? 404 : 200,
      contentType: 'application/json',
      body: JSON.stringify(body ?? { title: `No mocked body for page ${requestedPage}` }),
    });
  });
}
