import type { Page } from '@playwright/test';
import type { ZodType } from 'zod';

// Drift guard: every mocked body must satisfy the feature's wire schema, so static
// JSON fixtures cannot silently diverge from what the real API returns.
export function parseMockBody<T>(schema: ZodType<T>, body: unknown, label: string): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new Error(`Mock body for '${label}' does not match the wire schema:\n${result.error.message}`);
  }
  return result.data;
}

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
