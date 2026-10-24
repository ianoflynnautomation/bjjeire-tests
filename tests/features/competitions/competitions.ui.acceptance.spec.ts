import { test, competitionsTestConfig } from './fixtures';
import { faker } from '@faker-js/faker';
import { API_ROUTES } from '@api/support';
import { competitionCardFromDto } from '@ui/pages/competitions/competitions.card.mapper';
import { emptyPage } from '../common/testdata/mocks/empty-page';
import { paginatePages } from '@ui/mocks/paginate.mock';
import { SEEDED_COMPETITION_DONEGAL_GI_CLASSIC, SEEDED_COMPETITION_DONEGAL_GI_CLASSIC_PARTIAL_NAME } from './seeded';
import competitionsFixture from './testdata/competitions-pagination-page-1.json';
import { squash } from '@squash/annotations';

test.use(competitionsTestConfig);

const seededCompetition = SEEDED_COMPETITION_DONEGAL_GI_CLASSIC;
const seededCompetitionCard = competitionCardFromDto(seededCompetition);
const seededCompetitionPartialName = SEEDED_COMPETITION_DONEGAL_GI_CLASSIC_PARTIAL_NAME;

const PAGINATION_PAGE_SIZE = 10;
const pagedCompetitions = paginatePages(competitionsFixture.data, PAGINATION_PAGE_SIZE, API_ROUTES.competitions);
const firstPageCompetition = competitionsFixture.data
  .slice(0, PAGINATION_PAGE_SIZE)
  .find(competition => competition.name === 'Grappling Series Cork Open Summer 2026');
const secondPageCompetition = competitionsFixture.data
  .slice(PAGINATION_PAGE_SIZE)
  .find(competition => competition.name === 'Grappling Industries Dublin');
if (!firstPageCompetition || !secondPageCompetition) {
  throw new Error('competitions-pagination-page-1.json no longer contains the expected page-1 and page-2 competitions');
}

test.describe('Competitions UI acceptance', { tag: ['@competitions', '@ui', '@desktop', '@squash'] }, () => {
  test(
    'visitor should see the competition list when opening Competitions',
    {
      tag: ['@smoke', '@acceptance'],
      annotation: squash({ weight: 'high', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ competitionsPage }) => {
      await competitionsPage.goTo();
      await competitionsPage.verifyIsLoaded();
    },
  );

  test(
    'visitor should see an empty state when no competition matches the search',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ competitionsPage }) => {
      await competitionsPage.goTo();
      await competitionsPage.searchFor(faker.string.alphanumeric({ length: 12 }));
      await competitionsPage.expectNoResults();
    },
  );

  test(
    'visitor should find only the competition searched for by name',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ competitionsPage }) => {
      await competitionsPage.goTo();
      await competitionsPage.searchFor(seededCompetition.name);
      await competitionsPage.expectResultCount(1);
      await competitionsPage.expectCardData(seededCompetitionCard);
    },
  );

  test(
    'visitor should find a competition by part of its name',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ competitionsPage }) => {
      await competitionsPage.goTo();
      await competitionsPage.searchFor(seededCompetitionPartialName);
      await competitionsPage.expectResultCount(1);
      await competitionsPage.expectCardData(seededCompetitionCard);
    },
  );

  test(
    'visitor should see different competitions on each page',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
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
    'visitor should see the no-data message when the API returns no competitions',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ mockCompetitions, competitionsPage }) => {
      await mockCompetitions(emptyPage);
      await competitionsPage.goTo();
      await competitionsPage.verifyIsLoaded();
      await competitionsPage.expectEmptyStateMessage();
    },
  );

  test(
    'visitor should see a network error message when the competitions request fails',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ mockNetworkError, competitionsPage }) => {
      await mockNetworkError();
      await competitionsPage.goTo();
      await competitionsPage.expectNetworkErrorMessage();
    },
  );

  test(
    'visitor should see a server error message when the competitions API returns a server error',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ mockServerError, competitionsPage }) => {
      await mockServerError();
      await competitionsPage.goTo();
      await competitionsPage.expectServerErrorMessage();
    },
  );
});
