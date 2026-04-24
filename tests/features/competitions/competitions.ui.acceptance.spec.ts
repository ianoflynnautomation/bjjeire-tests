import { test } from '@ui/fixtures';
import { SEEDED_COMPETITION_ADCC, SEEDED_COMPETITION_ADCC_PARTIAL } from '../../testdata/competitions';

test.describe('Competitions UI Acceptance', { tag: ['@competitions', '@ui', '@desktop'] }, () => {
  test.beforeEach(({ featureFlags }) => {
    test.skip(!featureFlags.Competitions, "feature 'Competitions' disabled");
  });

  test('loads the competitions list', { tag: ['@smoke', '@acceptance', '@mobile'] }, async ({ competitionsScreen }) => {
    await competitionsScreen.navigate();
    await competitionsScreen.verifyIsLoaded();
    await competitionsScreen.expectHeaderVisible();
  });

  test('search with no match shows the empty state', { tag: '@acceptance' }, async ({ competitionsScreen }) => {
    await competitionsScreen.navigate();
    await competitionsScreen.searchFor('zzz-no-match-xyz');
    await competitionsScreen.expectNoResults();
    await competitionsScreen.clearSearch();
    await competitionsScreen.expectAtLeastOneResult();
  });

  test(
    'search by competition name shows that competition only',
    { tag: '@acceptance' },
    async ({ competitionsScreen }) => {
      await competitionsScreen.navigate();
      await competitionsScreen.searchFor(SEEDED_COMPETITION_ADCC.name);
      await competitionsScreen.expectSearchValue(SEEDED_COMPETITION_ADCC.name);
      await competitionsScreen.expectCardData(SEEDED_COMPETITION_ADCC.name, SEEDED_COMPETITION_ADCC);
    },
  );

  test(
    'search by partial competition name shows that competition only',
    { tag: '@acceptance' },
    async ({ competitionsScreen }) => {
      await competitionsScreen.navigate();
      await competitionsScreen.searchFor(SEEDED_COMPETITION_ADCC_PARTIAL);
      await competitionsScreen.expectSearchValue(SEEDED_COMPETITION_ADCC_PARTIAL);
      await competitionsScreen.expectCardData(SEEDED_COMPETITION_ADCC.name, SEEDED_COMPETITION_ADCC);
    },
  );
});
