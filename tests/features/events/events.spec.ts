import { test } from '@fixtures/bjjeire';

test.describe('Events @events', () => {
  test.beforeEach(({ featureFlags }) => {
    test.skip(!featureFlags.BjjEvents, "feature 'BjjEvents' disabled");
  });

  test('loads the events list and shows header + search @smoke', async ({ eventsPage }) => {
    await eventsPage.navigate();
    await eventsPage.verifyIsLoaded();
    await eventsPage.verifyListSettled();
    await eventsPage.expectHeaderVisible();
  });

  test('search filters the rendered events list @regression', async ({ eventsPage }) => {
    await eventsPage.navigate();
    await eventsPage.verifyListSettled();
    await eventsPage.searchFor('zzz-no-match-xyz');
    await eventsPage.expectNoResults();
    await eventsPage.clearSearch();
    await eventsPage.expectAtLeastOneResult();
  });
});
