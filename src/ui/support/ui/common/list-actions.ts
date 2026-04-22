import { expect, type Locator, type Page } from '@playwright/test';
import { TIMEOUTS } from '@api/support/config';

function routeToLabel(route: string): string {
  const trimmed = route.replace(/^\//, '');
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export async function navigateToRoute(
  page: Page,
  route: string,
  options: Readonly<{ waitForFeatureFlags?: boolean }> = {},
): Promise<void> {
  const flagsReady = options.waitForFeatureFlags
    ? page
        .waitForResponse(resp => /\/api\/featureflag/i.test(resp.url()) && resp.ok(), {
          timeout: TIMEOUTS.navigation,
        })
        .catch(() => null)
    : null;

  await page.goto(route);
  await flagsReady;

  if (new URL(page.url()).pathname === route) {
    return;
  }

  const label = routeToLabel(route);
  await page.getByRole('navigation').getByRole('link', { name: label, exact: true }).first().click();
  await page.waitForURL(new RegExp(`${route}(?:[/?#]|$)`));
}

export async function waitForSearchReady(input: Locator): Promise<void> {
  await expect(input).toBeVisible();
  await expect(input).toBeEditable();
}

export async function search(input: Locator, value: string): Promise<void> {
  await waitForSearchReady(input);
  await input.click();
  await input.fill(value);
}

export async function clearSearch(input: Locator, clearButton?: Locator): Promise<void> {
  await waitForSearchReady(input);

  if (clearButton && (await clearButton.isVisible().catch(() => false))) {
    await clearButton.click();
    return;
  }

  await input.fill('');
}

export async function filterBy(select: Locator, value: string): Promise<void> {
  await expect(select).toBeVisible();
  await select.selectOption({ label: value });
}

export async function resetFilter(select: Locator): Promise<void> {
  await expect(select).toBeVisible();
  await select.selectOption({ index: 0 });
}

export async function clickRow(row: Locator): Promise<void> {
  await expect(row).toBeVisible();
  await row.click();
}

export async function getRowCount(rows: Locator): Promise<number> {
  return rows.count();
}
