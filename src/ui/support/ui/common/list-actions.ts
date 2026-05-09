import { expect, type Locator, type Page } from '@playwright/test';
import { TIMEOUTS } from '@shared/config';

const FEATURE_FLAGS_URL_PATTERN = /\/api\/featureflag/i;

function routeToLabel(route: string): string {
  const trimmed = route.replace(/^\//, '');
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export async function navigateToRoute(page: Page, route: string): Promise<void> {
  const flagsReady = page
    .waitForResponse(resp => FEATURE_FLAGS_URL_PATTERN.test(resp.url()) && resp.ok(), {
      timeout: TIMEOUTS.standard,
    })
    .catch(() => null);

  await page.goto(route);

  if (new URL(page.url()).pathname === route) {
    return;
  }

  await flagsReady;

  const label = routeToLabel(route);
  await page.getByRole('navigation').getByRole('link', { name: label, exact: true }).first().click();
  await page.waitForURL(new RegExp(`${route}(?:[/?#]|$)`));
}

async function ensureSearchInputReady(input: Locator): Promise<void> {
  await expect(input).toBeVisible();
  await expect(input).toBeEditable();
}

export async function search(input: Locator, value: string): Promise<void> {
  await ensureSearchInputReady(input);
  await input.fill(value);
}

export async function clearSearch(input: Locator, clearButton?: Locator): Promise<void> {
  await ensureSearchInputReady(input);

  if (clearButton && (await clearButton.isVisible().catch(() => false))) {
    await clearButton.click();
  } else {
    await input.fill('');
  }

  await expect(input).toHaveValue('');
}
