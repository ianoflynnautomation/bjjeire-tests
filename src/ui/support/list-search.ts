import { expect, type Locator, type Page } from '@playwright/test';

export const LIST_API_URL = {
  gyms: /\/api\/v[12]\/gym(?:\?|$)/i,
  events: /\/api\/v[12]\/bjjevent(?:\?|$)/i,
  competitions: /\/api\/v[12]\/competition(?:\?|$)/i,
  stores: /\/api\/v[12]\/store(?:\?|$)/i,
} as const;

export async function fillListSearch(page: Page, input: Locator, term: string): Promise<void> {
  await input.clear();
  if (term.length === 0) {
    await expect(page).toHaveURL(url => !url.searchParams.has('q'));
    await expect(input).toHaveValue('');
    return;
  }
  await input.fill(term);
  await expect(page).toHaveURL(url => url.searchParams.get('q') === term);
  await expect(input).toHaveValue(term);
}

export async function clearListSearch(page: Page, input: Locator): Promise<void> {
  await fillListSearch(page, input, '');
}

export async function waitForListOrEmpty(listItems: Locator, emptyState: Locator): Promise<void> {
  await expect(listItems.or(emptyState).first()).toBeVisible();
}

export async function performAndWaitForApi(
  page: Page,
  urlPattern: RegExp,
  action: () => Promise<unknown>,
  query?: Readonly<Record<string, string | null>>,
): Promise<void> {
  const pending = page.waitForResponse(response => {
    if (!urlPattern.test(response.url()) || response.request().method() !== 'GET') return false;
    if (!query) return true;
    const params = new URL(response.url()).searchParams;
    return Object.entries(query).every(([key, value]) =>
      value === null ? !params.has(key) : params.get(key) === value,
    );
  });
  await action();
  await pending;
}
