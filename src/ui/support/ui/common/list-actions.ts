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
