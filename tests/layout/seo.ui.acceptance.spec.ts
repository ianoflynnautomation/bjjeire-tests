import { test, expect } from '@ui/fixtures';
import { expectDocumentMeta, gotoAppShell } from '@ui/support';
import { squash } from '@squash/annotations';

const SITE_DESCRIPTION =
  'Discover Brazilian Jiu-Jitsu tournaments, seminars, open mats, and gyms across Ireland. The community-first directory for BJJ in Ireland.';

const ROUTE_TITLES = {
  '/events': 'BJJ Events in Ireland | BJJ Éire',
  '/gyms': 'BJJ Gyms in Ireland | BJJ Éire',
  '/competitions': 'BJJ Competitions | BJJ Éire',
  '/stores': 'BJJ Clothing Stores | BJJ Éire',
  '/about': 'About | BJJ Éire',
} as const;

test.describe('SEO UI acceptance', { tag: ['@layout', '@seo', '@ui', '@desktop', '@squash'] }, () => {
  for (const [path, title] of Object.entries(ROUTE_TITLES)) {
    test(
      `${path} page should have a document title and description`,
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'approved', nature: 'non functional', type: 'regression' }),
      },
      async ({ page }) => {
        await test.step(`When a visitor opens ${path}`, async () => {
          await gotoAppShell(page, path);
        });

        await test.step('Then the page has its own title and the site description', async () => {
          await expectDocumentMeta(page, { title, description: SITE_DESCRIPTION });
        });
      },
    );
  }

  test(
    'visitor should see the tab title change when moving to another page',
    {
      tag: '@acceptance',
      annotation: squash({
        weight: 'medium',
        status: 'work in progress',
        nature: 'non functional',
        type: 'regression',
      }),
    },
    async ({ page, headerSection }) => {
      await test.step('When a visitor opens Gyms', async () => {
        await gotoAppShell(page, '/gyms');
      });

      await test.step('And the visitor moves to Stores from the navigation', async () => {
        await headerSection.openPage('Stores');
      });

      await test.step('Then the tab title names Stores', async () => {
        await expect(page).toHaveTitle(ROUTE_TITLES['/stores']);
      });
    },
  );
});
