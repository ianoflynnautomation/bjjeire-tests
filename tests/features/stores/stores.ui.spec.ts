import { test } from '@core/fixtures';

test.describe('Stores @stores @desktop', () => {
  test.beforeEach(({ featureFlags }) => {
    test.skip(!featureFlags.Stores, "feature 'Stores' disabled");
  });

  test('loads the stores list and shows header + search @smoke @mobile', async ({ storesScreen }) => {
    await test.step('Open the stores route', async () => {
      await storesScreen.navigate();
      await storesScreen.verifyIsLoaded();
      await storesScreen.verifyListSettled();
    });

    await test.step('Verify the stores header is visible', async () => {
      await storesScreen.expectHeaderVisible();
    });
  });

  test('search filters the rendered stores list @regression', async ({ storesScreen }) => {
    await test.step('Open the stores list', async () => {
      await storesScreen.navigate();
      await storesScreen.verifyListSettled();
    });

    await test.step('Search for an absent store', async () => {
      await storesScreen.searchFor('zzz-no-match-xyz');
      await storesScreen.expectNoResults();
    });

    await test.step('Clear the search and recover results', async () => {
      await storesScreen.clearSearch();
      await storesScreen.expectAtLeastOneResult();
    });
  });
});
