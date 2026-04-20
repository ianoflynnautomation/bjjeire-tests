import { test } from '@core/fixtures';

test.describe('Events @events @desktop', () => {
  test.beforeEach(({ featureFlags }) => {
    test.skip(!featureFlags.BjjEvents, "feature 'BjjEvents' disabled");
  });

  test('loads the events list and shows header + search @smoke @mobile', async ({ eventsScreen }) => {
    await test.step('Open the events route', async () => {
      await eventsScreen.navigate();
      await eventsScreen.verifyIsLoaded();
      await eventsScreen.verifyListSettled();
    });

    await test.step('Verify the events header is visible', async () => {
      await eventsScreen.expectHeaderVisible();
    });
  });

  test('search filters the rendered events list @regression', async ({ eventsScreen }) => {
    await test.step('Open the events list', async () => {
      await eventsScreen.navigate();
      await eventsScreen.verifyListSettled();
    });

    await test.step('Search for an absent event', async () => {
      await eventsScreen.searchFor('zzz-no-match-xyz');
      await eventsScreen.expectNoResults();
    });

    await test.step('Clear the search and recover results', async () => {
      await eventsScreen.clearSearch();
      await eventsScreen.expectAtLeastOneResult();
    });
  });
});
