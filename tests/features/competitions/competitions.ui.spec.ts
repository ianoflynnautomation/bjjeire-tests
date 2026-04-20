import { test } from '@core/fixtures';

test.describe('Competitions @competitions @desktop', () => {
  test.beforeEach(({ featureFlags }) => {
    test.skip(!featureFlags.Competitions, "feature 'Competitions' disabled");
  });

  test('loads the competitions list and shows header + search @smoke @mobile', async ({ competitionsScreen }) => {
    await test.step('Open the competitions route', async () => {
      await competitionsScreen.navigate();
      await competitionsScreen.verifyIsLoaded();
      await competitionsScreen.verifyListSettled();
    });

    await test.step('Verify the screen shell is present', async () => {
      await competitionsScreen.expectHeaderVisible();
    });
  });

  test('search filters the rendered competitions list @regression', async ({ competitionsScreen }) => {
    await test.step('Open the competitions list', async () => {
      await competitionsScreen.navigate();
      await competitionsScreen.verifyListSettled();
    });

    await test.step('Apply a no-match search term', async () => {
      await competitionsScreen.searchFor('zzz-no-match-xyz');
      await competitionsScreen.expectNoResults();
    });

    await test.step('Clear the search and recover results', async () => {
      await competitionsScreen.clearSearch();
      await competitionsScreen.expectAtLeastOneResult();
    });
  });
});
