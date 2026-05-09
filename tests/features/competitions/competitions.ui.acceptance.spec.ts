import { test } from '@ui/features/competitions/competitions.fixture';
import * as CompetitionsPage from '@ui/features/competitions/competitions.page';
import { SEEDED_COMPETITION_ADCC, SEEDED_COMPETITION_ADCC_PARTIAL } from '../../testdata/competitions';
import { NO_MATCH_SEARCH_TERM } from '../../testdata/strings';

test.describe('Competitions UI Acceptance', { tag: ['@competitions', '@ui', '@desktop'] }, () => {
  test('loads the competitions list', { tag: ['@smoke', '@acceptance', '@mobile'] }, async () => {
    await CompetitionsPage.navigate();
    await CompetitionsPage.verifyIsLoaded();
    await CompetitionsPage.expectHeaderVisible();
  });

  test('search with no match shows the empty state', { tag: '@acceptance' }, async () => {
    await CompetitionsPage.navigate();
    await CompetitionsPage.searchFor(NO_MATCH_SEARCH_TERM);
    await CompetitionsPage.expectNoResults();
    await CompetitionsPage.clearSearch();
    await CompetitionsPage.expectAtLeastOneResult();
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
