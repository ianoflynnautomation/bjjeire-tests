import { expect, test } from '@ui/fixtures';
import { EXPECTED_COMPETITION_ADCC_CARD, EXPECTED_COMPETITION_ADCC_PARTIAL } from '../../testdata/competitions';
import { faker } from '@faker-js/faker';
import { emptyPage, NO_DATA } from '@ui/pages/common/empty.page';
import { ERROR, ERROR_TITLE, NETWORK_ERROR_MESSAGE, SERVER_ERROR_MESSAGE } from '@ui/pages/common/error.page';

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
    { tag: ['@competitions', '@acceptance'] },
    async ({ page, mockCompetitions, competitionsPage }) => {
      await mockCompetitions(emptyPage);
      await competitionsPage.goTo();
      await competitionsPage.verifyIsLoaded();
      await expect(page.getByTestId(NO_DATA.title)).toHaveText('No Competitions Found');
      await expect(page.getByTestId(NO_DATA.messageLine1)).toHaveText('No competitions are available right now.');
      await expect(page.getByTestId(NO_DATA.messageLine2)).toHaveText('Check back later.');
    },
  );

  test(
    'Given the API request fails, when a visitor opens Competitions, then a network error message is shown',
    { tag: ['@competitions', '@acceptance'] },
    async ({ page, mockNetworkError, competitionsPage }) => {
      await mockNetworkError('competitions');
      await competitionsPage.goTo();
      await expect(page.getByTestId(ERROR.title)).toHaveText(ERROR_TITLE);
      await expect(page.getByTestId(ERROR.messageLine1)).toHaveText(NETWORK_ERROR_MESSAGE);
    },
  );

  test(
    'Given the API returns a server error, when a visitor opens Competitions, then a server error message is shown',
    { tag: ['@competitions', '@acceptance'] },
    async ({ page, mockServerError, competitionsPage }) => {
      await mockServerError('competitions');
      await competitionsPage.goTo();
      await expect(page.getByTestId(ERROR.title)).toHaveText(ERROR_TITLE);
      await expect(page.getByTestId(ERROR.messageLine1)).toHaveText(SERVER_ERROR_MESSAGE);
    },
  );
});
