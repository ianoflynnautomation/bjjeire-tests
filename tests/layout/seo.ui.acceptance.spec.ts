import { test, expect } from '@ui/fixtures';
import { squash } from '@squash/annotations';

const SITE_TITLE = 'BJJ Éire — Find BJJ Events & Gyms Across Ireland';
const SITE_DESCRIPTION =
  'Discover Brazilian Jiu-Jitsu tournaments, seminars, open mats, and gyms across Ireland. The community-first directory for BJJ in Ireland.';

const ROUTES = ['/events', '/gyms', '/competitions', '/stores', '/about'] as const;

test.describe('SEO UI acceptance', { tag: ['@layout', '@seo', '@ui', '@desktop', '@squash'] }, () => {
  for (const path of ROUTES) {
    test(
      `${path} page should have a document title and description`,
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'approved', nature: 'non functional', type: 'regression' }),
      },
      async ({ page }) => {
        await test.step(`When a visitor opens ${path}`, async () => {
          await page.goto(path);
        });

        await test.step('Then the page has the site title and description', async () => {
          await expect(page).toHaveTitle(SITE_TITLE);
          await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', SITE_DESCRIPTION);
        });
      },
    );
  }
});
