import { test as core, expect } from '@ui/fixtures';
import { pageFixture } from '@ui/fixtures/mock-fixture';
import { EventsPage } from '@ui/pages/events/events.page';
import { goto } from '@ui/support';

// The app's default route is Events, so this layout spec builds that page object on the cross-cutting test.
const test = core.extend<{ eventsPage: EventsPage }>({
  eventsPage: pageFixture(EventsPage),
});

const DEFAULT_PATH_PATTERN = /\/events(?:[/?#]|$)/;

test.describe('Routing UI acceptance', { tag: ['@layout', '@routing', '@ui', '@desktop'] }, () => {
  test(
    'Given an unknown URL, when a visitor opens it, then they are redirected to the default page',
    { tag: '@acceptance' },
    async ({ page, eventsPage }) => {
      await goto(page, '/this-page-does-not-exist');
      await expect(page).toHaveURL(DEFAULT_PATH_PATTERN);
      await eventsPage.verifyIsLoaded();
    },
  );

  test(
    'Given the root URL, when a visitor opens it, then the default page is displayed',
    { tag: '@acceptance' },
    async ({ page, eventsPage }) => {
      await goto(page, '/');
      await expect(page).toHaveURL(DEFAULT_PATH_PATTERN);
      await eventsPage.verifyIsLoaded();
    },
  );
});
