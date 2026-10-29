import { test } from '@ui/fixtures';
import { expectDocumentMeta } from '@ui/support';
import { squash } from '@squash/annotations';

const SITE_META = {
  title: 'BJJ Éire — Find BJJ Events & Gyms Across Ireland',
  description:
    'Discover Brazilian Jiu-Jitsu tournaments, seminars, open mats, and gyms across Ireland. The community-first directory for BJJ in Ireland.',
} as const;

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
          await expectDocumentMeta(page, SITE_META);
        });
      },
    );
  }
});
