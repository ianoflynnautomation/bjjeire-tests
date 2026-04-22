import { test } from '@ui/fixtures';
import type { GymCard } from '@ui/features/gyms/gym-card.screen';
import { GymStatus } from '@api/features/gyms/gyms.types';

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

  test('search by gym name shows that gym in the list @acceptance', async ({ gymsScreen }) => {
    const EXPECTED_GYM_CARD: GymCard = {
      name: 'BJJ Cork',
      status: GymStatus.Active.toUpperCase(),
      county: 'Cork County',
      classes: ['BJJ Gi (All Levels)', 'BJJ No-Gi (All Levels)'],
    };

    await gymsScreen.navigate();
    await gymsScreen.searchFor(EXPECTED_GYM_CARD.name);
    await gymsScreen.expectSearchValue(EXPECTED_GYM_CARD.name);
    await gymsScreen.expectCardData(EXPECTED_GYM_CARD.name, EXPECTED_GYM_CARD);
  });

  test('search by partial gym name shows that gym only @acceptance', async ({ gymsScreen }) => {
    const EXPECTED_GYM_CARD: GymCard = {
      name: 'BJJ Cork',
      status: GymStatus.Active.toUpperCase(),
      county: 'Cork County',
      classes: ['BJJ Gi (All Levels)', 'BJJ No-Gi (All Levels)'],
    };

    const expectedPartialName = 'BJJ C';

    await gymsScreen.navigate();
    await gymsScreen.searchFor(expectedPartialName);
    await gymsScreen.expectSearchValue(expectedPartialName);
    await gymsScreen.expectCardData(EXPECTED_GYM_CARD.name, EXPECTED_GYM_CARD);
  });
});
