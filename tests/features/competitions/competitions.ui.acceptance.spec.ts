import { test } from '@ui/fixtures';
import { EXPECTED_COMPETITION_ADCC_CARD, EXPECTED_COMPETITION_ADCC_PARTIAL } from '../../testdata/competitions';
import { faker } from '@faker-js/faker';
import { emptyPage } from '@ui/pages/common/empty.page';

test.describe('Competitions UI acceptance', { tag: ['@competitions', '@ui', '@desktop'] }, () => {
  test(
    'Given available competitions, when a visitor opens Competitions, then the competition list is displayed',
    { tag: ['@smoke'] },
    async ({ competitionsPage }) => {
      await competitionsPage.goTo();
      await competitionsPage.verifyIsLoaded();
    },
  );

  test(
    'Given no matching competition, when a visitor searches, then an empty state is displayed',
    { tag: '@acceptance' },
    async ({ competitionsPage }) => {
      await competitionsPage.goTo();
      await competitionsPage.searchFor(faker.string.alphanumeric({ length: 12 }));
      await competitionsPage.expectNoResults();
    },
  );

  test(
    'Given a competition name, when a visitor searches, then only that competition is displayed',
    { tag: '@acceptance' },
    async ({ competitionsPage }) => {
      await competitionsPage.goTo();
      await competitionsPage.searchFor(EXPECTED_COMPETITION_ADCC_CARD.name);
      await competitionsPage.expectSearchValue(EXPECTED_COMPETITION_ADCC_CARD.name);
      await competitionsPage.expectCardData(EXPECTED_COMPETITION_ADCC_CARD);
    },
  );

  test(
    'Given part of a competition name, when a visitor searches, then the matching competition is displayed',
    { tag: '@acceptance' },
    async ({ competitionsPage }) => {
      await competitionsPage.goTo();
      await competitionsPage.searchFor(EXPECTED_COMPETITION_ADCC_PARTIAL);
      await competitionsPage.expectSearchValue(EXPECTED_COMPETITION_ADCC_PARTIAL);
      await competitionsPage.expectCardData(EXPECTED_COMPETITION_ADCC_CARD);
    },
  );

  test(
    'Given the API returns no competitions, when a visitor opens Competitions, then the no-data message is shown',
    { tag: '@acceptance' },
    async ({ mockCompetitions, competitionsPage }) => {
      await mockCompetitions(emptyPage);
      await competitionsPage.goTo();
      await competitionsPage.verifyIsLoaded();
      await competitionsPage.expectEmptyStateMessage();
    },
  );

  test(
    'Given the API request fails, when a visitor opens Competitions, then a network error message is shown',
    { tag: '@acceptance' },
    async ({ mockNetworkError, competitionsPage }) => {
      await mockNetworkError('competitions');
      await competitionsPage.goTo();
      await competitionsPage.expectNetworkErrorMessage();
    },
  );

  test(
    'Given the API returns a server error, when a visitor opens Competitions, then a server error message is shown',
    { tag: '@acceptance' },
    async ({ mockServerError, competitionsPage }) => {
      await mockServerError('competitions');
      await competitionsPage.goTo();
      await competitionsPage.expectServerErrorMessage();
    },
  );
});
