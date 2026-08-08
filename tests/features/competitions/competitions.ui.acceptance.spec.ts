import { test } from '@ui/fixtures';
import { faker } from '@faker-js/faker';
import { competitionCardFromDto } from '@ui/pages/competitions/competitions.card.mapper';
import { emptyPage } from '@ui/pages/common/empty.page';
import { paginatePages } from '@ui/mocks/paginate.mock';
import {
  SEEDED_COMPETITION_DONEGAL_GI_CLASSIC,
  SEEDED_COMPETITION_DONEGAL_GI_CLASSIC_PARTIAL_NAME,
} from '../../testdata/seeded/competitions';
import competitionsFixture from '../../testdata/mocks/competitions.page-1.json';

const seededCompetition = SEEDED_COMPETITION_DONEGAL_GI_CLASSIC;
const seededCompetitionCard = competitionCardFromDto(seededCompetition);
const seededCompetitionPartialName = SEEDED_COMPETITION_DONEGAL_GI_CLASSIC_PARTIAL_NAME;

const PAGINATION_PAGE_SIZE = 10;
const pagedCompetitions = paginatePages(competitionsFixture.data, PAGINATION_PAGE_SIZE, '/api/v1/competition');
const firstPageCompetition = competitionsFixture.data
  .slice(0, PAGINATION_PAGE_SIZE)
  .find(competition => competition.name === 'Grappling Series Cork Open Summer 2026');
const secondPageCompetition = competitionsFixture.data
  .slice(PAGINATION_PAGE_SIZE)
  .find(competition => competition.name === 'Grappling Industries Dublin');
if (!firstPageCompetition || !secondPageCompetition) {
  throw new Error('competitions.page-1.json no longer contains the expected page-1 and page-2 competitions');
}

test.describe('Competitions UI acceptance', { tag: ['@competitions', '@ui', '@desktop'] }, () => {
  test(
    'Given available competitions, when a visitor opens Competitions, then the competition list is displayed',
    { tag: ['@smoke', '@acceptance'] },
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
      await competitionsPage.searchFor(seededCompetition.name);
      await competitionsPage.expectSearchValue(seededCompetition.name);
      await competitionsPage.expectCardData(seededCompetitionCard);
    },
  );

  test(
    'Given part of a competition name, when a visitor searches, then the matching competition is displayed',
    { tag: '@acceptance' },
    async ({ competitionsPage }) => {
      await competitionsPage.goTo();
      await competitionsPage.searchFor(seededCompetitionPartialName);
      await competitionsPage.expectSearchValue(seededCompetitionPartialName);
      await competitionsPage.expectCardData(seededCompetitionCard);
    },
  );

  test.skip(
    'Given the listing spans more than one page, when a visitor moves between pages, then each page shows its own competitions',
    { tag: '@acceptance' },
    async ({ mockCompetitionsPages, competitionsPage }) => {
      await mockCompetitionsPages(pagedCompetitions);
      await competitionsPage.goTo();
      await competitionsPage.expectCardData({ name: firstPageCompetition.name });
      await competitionsPage.expectPagination(1, 2);

      await competitionsPage.goToNextPage();
      await competitionsPage.expectCardData({ name: secondPageCompetition.name });
      await competitionsPage.expectCardAbsent(firstPageCompetition.name);
      await competitionsPage.expectPagination(2, 2);

      await competitionsPage.goToPreviousPage();
      await competitionsPage.expectCardData({ name: firstPageCompetition.name });
      await competitionsPage.expectPagination(1, 2);
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
