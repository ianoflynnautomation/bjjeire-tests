import { test, expect } from '@core/fixtures';

const ROUTES: ReadonlyArray<{ label: string; pathRe: RegExp; flag?: string }> = [
  { label: 'Events', pathRe: /\/events$/, flag: 'BjjEvents' },
  { label: 'Gyms', pathRe: /\/gyms$/, flag: 'Gyms' },
  { label: 'Competitions', pathRe: /\/competitions$/, flag: 'Competitions' },
  { label: 'Stores', pathRe: /\/stores$/, flag: 'Stores' },
  { label: 'About', pathRe: /\/about$/ },
];

test.describe('Navigation @navigation @desktop', () => {
  test('home redirects to a feature-gated default route @smoke @mobile', async ({ page, navBar }) => {
    await test.step('Open the home route', async () => {
      await page.goto('/');
      await navBar.verifyIsLoaded();
    });

    await test.step('Verify the app redirects to a valid feature route', async () => {
      await expect(page).toHaveURL(/\/(events|gyms|competitions|stores|about)$/);
    });
  });

  test('desktop nav links open their pages @regression', async ({ page, navBar, featureFlags }) => {
    await test.step('Open the shell', async () => {
      await page.goto('/');
      await navBar.verifyIsLoaded();
    });

    for (const { label, pathRe, flag } of ROUTES) {
      await test.step(`Navigate to ${label}`, async () => {
        if (flag && !featureFlags[flag]) {
          return;
        }

        await navBar.goTo(label);
        await expect(page).toHaveURL(pathRe);
      });
    }
  });

  test('unknown route redirects to the default route @regression', async ({ page }) => {
    await test.step('Open an unknown route', async () => {
      await page.goto('/this-page-definitely-does-not-exist');
    });

    await test.step('Verify the app redirects to a supported route', async () => {
      await expect(page).toHaveURL(/\/(events|gyms|competitions|stores|about)$/);
    });
  });
});
