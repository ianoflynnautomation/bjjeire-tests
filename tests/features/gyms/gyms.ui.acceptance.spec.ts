import { test } from '@ui/fixtures';
import { SEEDED_GYM_BJJ_CORK, SEEDED_GYM_BJJ_CORK_PARTIAL } from '../../testdata/gyms';

test.describe('Gyms UI Acceptance @gyms @ui @desktop', () => {
  test.beforeEach(({ featureFlags }) => {
    test.skip(!featureFlags.Gyms, "feature 'Gyms' disabled");
  });

  test('loads the gyms list @smoke @acceptance @mobile', async ({ gymsScreen }) => {
    await gymsScreen.navigate();
    await gymsScreen.verifyIsLoaded();
    await gymsScreen.expectHeaderVisible();
  });

  test('search with no match shows the empty state @acceptance', async ({ gymsScreen }) => {
    await gymsScreen.navigate();
    await gymsScreen.searchFor('zzz-no-match-xyz');
    await gymsScreen.expectNoResults();
    await gymsScreen.clearSearch();
    await gymsScreen.expectAtLeastOneResult();
  });

  test('search by gym name shows that gym only @acceptance', async ({ gymsScreen }) => {
    await gymsScreen.navigate();
    await gymsScreen.searchFor(SEEDED_GYM_BJJ_CORK.name);
    await gymsScreen.expectSearchValue(SEEDED_GYM_BJJ_CORK.name);
    await gymsScreen.expectCardData(SEEDED_GYM_BJJ_CORK.name, SEEDED_GYM_BJJ_CORK);
  });

  test('search by partial gym name shows that gym only @acceptance', async ({ gymsScreen }) => {
    await gymsScreen.navigate();
    await gymsScreen.searchFor(SEEDED_GYM_BJJ_CORK_PARTIAL);
    await gymsScreen.expectSearchValue(SEEDED_GYM_BJJ_CORK_PARTIAL);
    await gymsScreen.expectCardData(SEEDED_GYM_BJJ_CORK.name, SEEDED_GYM_BJJ_CORK);
  });
});
