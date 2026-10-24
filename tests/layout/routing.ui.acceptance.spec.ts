import { test as core, expect } from '@ui/fixtures';
import { pageFixture } from '@ui/fixtures/page-fixture';
import { EventsPage } from '@ui/pages/events/events.page';
import { gotoAppShell } from '@ui/support';
import { squash } from '@squash/annotations';

// The app's default route is Events, so this layout spec builds that page object on the cross-cutting test.
const test = core.extend<{ eventsPage: EventsPage }>({
  eventsPage: pageFixture(EventsPage),
});

const DEFAULT_PATH_PATTERN = /\/events(?:[/?#]|$)/;

test.describe('Routing UI acceptance', { tag: ['@layout', '@routing', '@ui', '@desktop', '@squash'] }, () => {
  test(
    'visitor should be redirected to the default page from an unknown URL',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ page, eventsPage }) => {
      await test.step('When a visitor opens an unknown address', async () => {
        await gotoAppShell(page, '/this-page-does-not-exist');
      });

      await test.step('Then the visitor is taken to the default page', async () => {
        await expect(page).toHaveURL(DEFAULT_PATH_PATTERN);
        await eventsPage.verifyIsLoaded();
      });
    },
  );

  test(
    'visitor should see the default page when opening the root URL',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ page, eventsPage }) => {
      await test.step('When a visitor opens the home page', async () => {
        await gotoAppShell(page, '/');
      });

      await test.step('Then the default page is displayed', async () => {
        await expect(page).toHaveURL(DEFAULT_PATH_PATTERN);
        await eventsPage.verifyIsLoaded();
      });
    },
  );
});
