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
