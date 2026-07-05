import { expect } from '@playwright/test';
import { test } from '@ui/fixtures';

const SITE_TITLE = 'BJJ Éire — Find BJJ Events & Gyms Across Ireland';
const SITE_DESCRIPTION =
  'Discover Brazilian Jiu-Jitsu tournaments, seminars, open mats, and gyms across Ireland. The community-first directory for BJJ in Ireland.';

const ROUTES = ['/events', '/gyms', '/competitions', '/stores', '/about'] as const;

test.describe('SEO UI acceptance', { tag: ['@layout', '@seo', '@ui', '@desktop'] }, () => {
  for (const path of ROUTES) {
    test(
      `Given the ${path} page, when it is opened, then the document title and description are present`,
      { tag: '@acceptance' },
      async ({ page }) => {
        await page.goto(path);

        await expect(page).toHaveTitle(SITE_TITLE);
        await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', SITE_DESCRIPTION);
      },
    );
  }
});
