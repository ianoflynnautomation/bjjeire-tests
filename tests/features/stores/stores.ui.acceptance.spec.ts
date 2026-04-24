import { test } from '@ui/fixtures';
import { SEEDED_STORE_BJJ_CORK, SEEDED_STORE_BJJ_CORK_PARTIAL } from '../../testdata/stores';

test.describe('Stores UI Acceptance @stores @ui @desktop', () => {
  test.beforeEach(({ featureFlags }) => {
    test.skip(!featureFlags.Stores, "feature 'Stores' disabled");
  });

  test('loads the stores list @smoke @acceptance @mobile', async ({ storesScreen }) => {
    await storesScreen.navigate();
    await storesScreen.verifyIsLoaded();
    await storesScreen.expectHeaderVisible();
  });

  test('search with no match shows the empty state @acceptance', async ({ storesScreen }) => {
    await storesScreen.navigate();
    await storesScreen.searchFor('zzz-no-match-xyz');
    await storesScreen.expectNoResults();
    await storesScreen.clearSearch();
    await storesScreen.expectAtLeastOneResult();
  });

  test('search by store name narrows the search input @acceptance', async ({ storesScreen }) => {
    await storesScreen.navigate();
    await storesScreen.searchFor(SEEDED_STORE_BJJ_CORK.name);
    await storesScreen.expectSearchValue(SEEDED_STORE_BJJ_CORK.name);
  });

  test('search by partial store name narrows the search input @acceptance', async ({ storesScreen }) => {
    await storesScreen.navigate();
    await storesScreen.searchFor(SEEDED_STORE_BJJ_CORK_PARTIAL);
    await storesScreen.expectSearchValue(SEEDED_STORE_BJJ_CORK_PARTIAL);
  });
});
