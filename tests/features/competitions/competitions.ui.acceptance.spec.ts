import { test } from '@ui/fixtures';
import { SEEDED_COMPETITION_ADCC, SEEDED_COMPETITION_ADCC_PARTIAL } from '../../testdata/competitions';

test.describe('Competitions UI Acceptance', { tag: ['@competitions', '@ui', '@desktop'] }, () => {
  test('loads the competitions list', { tag: ['@smoke'] }, async ({ competitionsPage }) => {
    await competitionsPage.navigate();
    await competitionsPage.verifyIsLoaded();
  });

  test('search with no match shows the empty state', { tag: '@acceptance' }, async ({ competitionsPage }) => {
    await competitionsPage.navigate();
    await competitionsPage.searchFor('xyz');
    await competitionsPage.expectNoResults();
  });

  test(
    'search by competition name shows that competition only',
    { tag: '@acceptance' },
    async ({ competitionsPage }) => {
      await competitionsPage.navigate();
      await competitionsPage.searchFor(SEEDED_COMPETITION_ADCC.name);
      await competitionsPage.expectSearchValue(SEEDED_COMPETITION_ADCC.name);
      await competitionsPage.expectCardData(SEEDED_COMPETITION_ADCC.name, SEEDED_COMPETITION_ADCC);
    },
  );

  test(
    'search by partial competition name shows that competition only',
    { tag: '@acceptance' },
    async ({ competitionsPage }) => {
      await competitionsPage.navigate();
      await competitionsPage.searchFor(SEEDED_COMPETITION_ADCC_PARTIAL);
      await competitionsPage.expectSearchValue(SEEDED_COMPETITION_ADCC_PARTIAL);
      await competitionsPage.expectCardData(SEEDED_COMPETITION_ADCC.name, SEEDED_COMPETITION_ADCC);
    },
  );
});
