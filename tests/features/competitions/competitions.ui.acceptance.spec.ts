import { test } from '@ui/fixtures';
import { EXPECTED_COMPETITION_ADCC_CARD, EXPECTED_COMPETITION_ADCC_PARTIAL } from '../../testdata/competitions';
import { faker } from '@faker-js/faker';
import competitionsFixture from '../../testdata/mocks/competitions.page-1.json';

test.describe('Competitions UI acceptance', { tag: ['@competitions', '@ui', '@desktop'] }, () => {
  test.beforeEach(async ({ mockCompetitions }) => {
    await mockCompetitions(competitionsFixture);
  });

  test(
    'Given available competitions, when a visitor opens Competitions, then the competition list is displayed',
    { tag: ['@smoke'] },
    async ({ competitionsPage }) => {
      await competitionsPage.navigate();
      await competitionsPage.verifyIsLoaded();
    },
  );

  test(
    'Given no matching competition, when a visitor searches, then an empty state is displayed',
    { tag: '@acceptance' },
    async ({ competitionsPage }) => {
      await competitionsPage.navigate();
      await competitionsPage.searchFor(faker.string.alphanumeric({ length: 12 }));
      await competitionsPage.expectNoResults();
    },
  );

  test(
    'Given a competition name, when a visitor searches, then only that competition is displayed',
    { tag: '@acceptance' },
    async ({ competitionsPage }) => {
      await competitionsPage.navigate();
      await competitionsPage.searchFor(EXPECTED_COMPETITION_ADCC_CARD.name);
      await competitionsPage.expectSearchValue(EXPECTED_COMPETITION_ADCC_CARD.name);
      await competitionsPage.expectCardData(EXPECTED_COMPETITION_ADCC_CARD.name, EXPECTED_COMPETITION_ADCC_CARD);
    },
  );

  test(
    'Given part of a competition name, when a visitor searches, then the matching competition is displayed',
    { tag: '@acceptance' },
    async ({ competitionsPage }) => {
      await competitionsPage.navigate();
      await competitionsPage.searchFor(EXPECTED_COMPETITION_ADCC_PARTIAL);
      await competitionsPage.expectSearchValue(EXPECTED_COMPETITION_ADCC_PARTIAL);
      await competitionsPage.expectCardData(EXPECTED_COMPETITION_ADCC_CARD.name, EXPECTED_COMPETITION_ADCC_CARD);
    },
  );
});
