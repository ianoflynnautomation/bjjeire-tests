import { test, expect } from '@core/fixtures';

test.describe('Gyms @gyms @desktop', () => {
  test.beforeEach(({ featureFlags }) => {
    test.skip(!featureFlags.Gyms, "feature 'Gyms' disabled");
  });

  test('loads the gyms list and shows header + search @smoke @mobile', async ({ gymsScreen }) => {
    await test.step('Open the gyms route', async () => {
      await gymsScreen.navigate();
      await gymsScreen.verifyIsLoaded();
      await gymsScreen.verifyListSettled();
    });

    await test.step('Verify the gyms header is visible', async () => {
      await gymsScreen.expectHeaderVisible();
    });
  });

  test('search with no match shows the empty state @regression', async ({ gymsScreen }) => {
    await test.step('Open the gyms list', async () => {
      await gymsScreen.navigate();
      await gymsScreen.verifyListSettled();
    });

    await test.step('Search for a non-existent gym', async () => {
      await gymsScreen.searchFor('zzz-no-match-xyz');
      await gymsScreen.expectSearchValue('zzz-no-match-xyz');
      await gymsScreen.expectNoResults();
    });

    await test.step('Clear the search and recover list results', async () => {
      await gymsScreen.clearSearch();
      await gymsScreen.expectAtLeastOneResult();
    });
  });

  test('search by gym name shows that gym in the list @regression', async ({ gymsScreen }) => {
    let firstCardName = '';

    await test.step('Open the gyms list and capture a seed gym name', async () => {
      await gymsScreen.navigate();
      await gymsScreen.verifyListSettled();
      await gymsScreen.expectAtLeastOneResult();
      firstCardName = await gymsScreen.cards.first().readName();
      expect(firstCardName, 'Seed data must contain at least one gym').not.toBe('');
    });

    await test.step('Search for the captured gym name', async () => {
      await gymsScreen.searchFor(firstCardName);
      await gymsScreen.expectSearchValue(firstCardName);
      await gymsScreen.verifyListSettled();
    });

    await test.step('Verify the matching card remains visible', async () => {
      await gymsScreen.expectCardWithName(firstCardName);
    });
  });

  test('county filter shows only gyms in the selected county @regression', async ({ gymsScreen }) => {
    const county = 'Dublin';

    await test.step('Open the gyms list', async () => {
      await gymsScreen.navigate();
      await gymsScreen.verifyListSettled();
    });

    await test.step('Filter the gyms by county', async () => {
      await gymsScreen.filterByCounty(county);
      await gymsScreen.verifyListSettled();
      await gymsScreen.expectAllCardsInCounty(county);
    });

    await test.step('Reset the county filter', async () => {
      await gymsScreen.resetCountyFilter();
      await gymsScreen.verifyListSettled();
      await gymsScreen.expectAtLeastOneResult();
    });
  });
});
