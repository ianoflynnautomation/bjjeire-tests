import { test, expect } from '@fixtures/bjjeire';

const ROUTES: ReadonlyArray<{ label: string; pathRe: RegExp; flag?: string }> = [
  { label: 'Events', pathRe: /\/events$/, flag: 'BjjEvents' },
  { label: 'Gyms', pathRe: /\/gyms$/, flag: 'Gyms' },
  { label: 'Competitions', pathRe: /\/competitions$/, flag: 'Competitions' },
  { label: 'Stores', pathRe: /\/stores$/, flag: 'Stores' },
  { label: 'About', pathRe: /\/about$/ },
];

test.describe('Navigation @navigation @smoke', () => {
  test('home redirects to a feature-gated default route @smoke', async ({ page, navBar }) => {
    await page.goto('/');
    await navBar.verifyIsLoaded();
    await expect(page).toHaveURL(/\/(events|gyms|competitions|stores|about)$/);
  });

  test('desktop nav links open their pages @regression', async ({ page, navBar, featureFlags }) => {
    await page.goto('/');
    await navBar.verifyIsLoaded();

    for (const { label, pathRe, flag } of ROUTES) {
      if (flag && !featureFlags[flag]) continue;
      await navBar.goTo(label);
      await expect(page).toHaveURL(pathRe);
    }
  });

  test('unknown route redirects to the default route @regression', async ({ page }) => {
    await page.goto('/this-page-definitely-does-not-exist');
    await expect(page).toHaveURL(/\/(events|gyms|competitions|stores|about)$/);
  });
});
