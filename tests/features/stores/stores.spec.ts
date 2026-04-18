import { test } from '@fixtures/bjjeire';

test.describe('Stores @stores', () => {
  test.beforeEach(({ featureFlags }) => {
    test.skip(!featureFlags.Stores, "feature 'Stores' disabled");
  });

  test('loads the stores list and shows header + search @smoke', async ({ storesPage }) => {
    await storesPage.navigate();
    await storesPage.verifyIsLoaded();
    await storesPage.verifyListSettled();
    await storesPage.expectHeaderVisible();
  });

  test('search filters the rendered stores list @regression', async ({ storesPage }) => {
    await storesPage.navigate();
    await storesPage.verifyListSettled();
    await storesPage.searchFor('zzz-no-match-xyz');
    await storesPage.expectNoResults();
    await storesPage.clearSearch();
    await storesPage.expectAtLeastOneResult();
  });
});
