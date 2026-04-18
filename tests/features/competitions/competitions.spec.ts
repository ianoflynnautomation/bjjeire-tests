import { test } from '@fixtures/bjjeire';

test.describe('Competitions @competitions', () => {
  test.beforeEach(({ featureFlags }) => {
    test.skip(!featureFlags.Competitions, "feature 'Competitions' disabled");
  });

  test('loads the competitions list and shows header + search @smoke', async ({ competitionsPage }) => {
    await competitionsPage.navigate();
    await competitionsPage.verifyIsLoaded();
    await competitionsPage.verifyListSettled();
    await competitionsPage.expectHeaderVisible();
  });

  test('search filters the rendered competitions list @regression', async ({ competitionsPage }) => {
    await competitionsPage.navigate();
    await competitionsPage.verifyListSettled();
    await competitionsPage.searchFor('zzz-no-match-xyz');
    await competitionsPage.expectNoResults();
    await competitionsPage.clearSearch();
    await competitionsPage.expectAtLeastOneResult();
  });
});
