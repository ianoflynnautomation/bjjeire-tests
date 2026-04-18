import { test } from '@fixtures/bjjeire';

test.describe('Gyms @gyms', () => {
  test.beforeEach(({ featureFlags }) => {
    test.skip(!featureFlags.Gyms, "feature 'Gyms' disabled");
  });

  test('loads the gyms list and shows header + search @smoke', async ({ gymsPage }) => {
    await gymsPage.navigate();
    await gymsPage.verifyIsLoaded();
    await gymsPage.verifyListSettled();
    await gymsPage.expectHeaderVisible();
  });

  test('search filters the rendered list @regression', async ({ gymsPage }) => {
    await gymsPage.navigate();
    await gymsPage.verifyListSettled();
    await gymsPage.searchFor('zzz-no-match-xyz');
    await gymsPage.expectSearchValue('zzz-no-match-xyz');
    await gymsPage.expectNoResults();
    await gymsPage.clearSearch();
    await gymsPage.expectAtLeastOneResult();
  });

  test('county filter restricts results @regression', async ({ gymsPage }) => {
    await gymsPage.navigate();
    await gymsPage.verifyListSettled();
    await gymsPage.filterByCounty('Dublin');
    await gymsPage.verifyListSettled();
    await gymsPage.resetCountyFilter();
    await gymsPage.verifyListSettled();
  });
});
