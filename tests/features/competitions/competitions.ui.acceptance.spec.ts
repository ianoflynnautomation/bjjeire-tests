import { test } from '@ui/fixtures';
import * as CompetitionsPage from '@ui/pages/competitions/competitions.page';
import { SEEDED_COMPETITION_ADCC, SEEDED_COMPETITION_ADCC_PARTIAL } from '../../testdata/competitions';

test.describe('Competitions UI Acceptance', { tag: ['@competitions', '@ui', '@desktop'] }, () => {
  test('loads the competitions list', { tag: ['@smoke'] }, async () => {
    await CompetitionsPage.navigate();
    await CompetitionsPage.verifyIsLoaded();
  });

  test('search with no match shows the empty state', { tag: '@acceptance' }, async () => {
    await CompetitionsPage.navigate();
    await CompetitionsPage.searchFor('xyz');
    await CompetitionsPage.expectNoResults();
  });

  test('search by competition name shows that competition only', { tag: '@acceptance' }, async () => {
    await CompetitionsPage.navigate();
    await CompetitionsPage.searchFor(SEEDED_COMPETITION_ADCC.name);
    await CompetitionsPage.expectSearchValue(SEEDED_COMPETITION_ADCC.name);
    await CompetitionsPage.expectCardData(SEEDED_COMPETITION_ADCC.name, SEEDED_COMPETITION_ADCC);
  });

  test('search by partial competition name shows that competition only', { tag: '@acceptance' }, async () => {
    await CompetitionsPage.navigate();
    await CompetitionsPage.searchFor(SEEDED_COMPETITION_ADCC_PARTIAL);
    await CompetitionsPage.expectSearchValue(SEEDED_COMPETITION_ADCC_PARTIAL);
    await CompetitionsPage.expectCardData(SEEDED_COMPETITION_ADCC.name, SEEDED_COMPETITION_ADCC);
  });
});
