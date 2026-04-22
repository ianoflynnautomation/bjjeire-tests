import { test } from '@ui/fixtures';
import type { StoreCard } from '@ui/features/stores/store-card.screen';

function partialName(name: string): string {
  return name.slice(0, Math.max(3, Math.min(12, name.length)));
}

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

  test('search by store name shows that store only @acceptance', async ({ storesScreen }) => {
    const EXPECTED_STORE_CARD: StoreCard = {
      name: 'BJJ Cork',
      description: '',
    };

    await storesScreen.navigate();
    await storesScreen.searchFor(EXPECTED_STORE_CARD.name);
    await storesScreen.expectSearchValue(EXPECTED_STORE_CARD.name);
  });

  test('search by partial store name shows that store only @acceptance', async ({ storesScreen }) => {
    const EXPECTED_STORE_CARD: StoreCard = {
      name: 'BJJ Cork',
      description: '',
    };
    const expectedPartialName = partialName(EXPECTED_STORE_CARD.name);

    await storesScreen.navigate();
    await storesScreen.navigate();
    await storesScreen.searchFor(expectedPartialName);
    await storesScreen.expectSearchValue(expectedPartialName);
  });
});
