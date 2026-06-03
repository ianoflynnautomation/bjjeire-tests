import type { Page, Response } from '@playwright/test';
import { LOADSTATE, TIMEOUTS } from '@shared/config';

type GotoOptions = Parameters<Page['goto']>[1];

const FEATURE_FLAGS_URL_PATTERN = /\/api\/(?:v\d+\/)?featureflag/i;

function routeToNavigationLabel(route: string): string {
  const trimmed = route.replace(/^\//, '');
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export async function gotoURL(
  page: Page,
  path: string,
  options: GotoOptions = { waitUntil: LOADSTATE },
): Promise<Response | null> {
  return page.goto(path, options);
}

export async function navigateToRoute(page: Page, route: string): Promise<void> {
  const flagsReady = page
    .waitForResponse(resp => FEATURE_FLAGS_URL_PATTERN.test(resp.url()) && resp.ok(), {
      timeout: TIMEOUTS.standard,
    })
    .catch(() => null);

  await page.goto(route);

  // Feature-flagged routes can redirect during first render before flags load.
  await flagsReady;

  if (new URL(page.url()).pathname === route) {
    return;
  }

  const label = routeToNavigationLabel(route);
  await page.getByRole('navigation').getByRole('link', { name: label, exact: true }).first().click();
  await page.waitForURL(new RegExp(`${route}(?:[/?#]|$)`));
}
