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
      await test.step('When a visitor opens Competitions', async () => {
        await competitionsPage.goTo();
      });

      await test.step('Then the competition list is displayed', async () => {
        await competitionsPage.verifyIsLoaded();
      });
    },
  );

  test(
    'visitor should see an empty state when no competition matches the search',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ competitionsPage }) => {
      await test.step('When a visitor opens Competitions', async () => {
        await competitionsPage.goTo();
      });

      await test.step('And the visitor searches for a name that matches nothing', async () => {
        await competitionsPage.searchFor(faker.string.alphanumeric({ length: 12 }));
      });

      await test.step('Then no competitions are listed', async () => {
        await competitionsPage.expectNoResults();
      });
    },
  );

  test(
    'visitor should find only the competition searched for by name',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ competitionsPage }) => {
      await test.step('When a visitor opens Competitions', async () => {
        await competitionsPage.goTo();
      });

      await test.step(`And the visitor searches for "${seededCompetition.name}"`, async () => {
        await competitionsPage.searchFor(seededCompetition.name);
      });

      await test.step('Then only that competition is listed', async () => {
        await competitionsPage.expectResultCount(1);
        await competitionsPage.expectCardData(seededCompetitionCard);
      });
    },
  );

  test(
    'visitor should find a competition by part of its name',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ competitionsPage }) => {
      await test.step('When a visitor opens Competitions', async () => {
        await competitionsPage.goTo();
      });

      await test.step(`And the visitor searches for "${seededCompetitionPartialName}"`, async () => {
        await competitionsPage.searchFor(seededCompetitionPartialName);
      });

      await test.step('Then the competition matching that part of the name is listed', async () => {
        await competitionsPage.expectResultCount(1);
        await competitionsPage.expectCardData(seededCompetitionCard);
      });
    },
  );

  test(
    'visitor should see different competitions on each page',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ mockCompetitionsPages, competitionsPage }) => {
      await test.step('Given the competition list has two pages', async () => {
        await mockCompetitionsPages(pagedCompetitions);
      });

      await test.step('When a visitor opens Competitions', async () => {
        await competitionsPage.goTo();
      });

      await test.step(`Then page 1 of 2 lists "${firstPageCompetition.name}"`, async () => {
        await competitionsPage.expectCardData({ name: firstPageCompetition.name });
        await competitionsPage.expectPagination(1, 2);
      });

      await test.step('When the visitor opens the next page', async () => {
        await competitionsPage.goToNextPage();
      });

      await test.step(`Then page 2 of 2 lists "${secondPageCompetition.name}"`, async () => {
        await competitionsPage.expectCardData({ name: secondPageCompetition.name });
        await competitionsPage.expectCardAbsent(firstPageCompetition.name);
        await competitionsPage.expectPagination(2, 2);
      });

      await test.step('When the visitor opens the previous page', async () => {
        await competitionsPage.goToPreviousPage();
      });

      await test.step(`Then page 1 of 2 lists "${firstPageCompetition.name}" again`, async () => {
        await competitionsPage.expectCardData({ name: firstPageCompetition.name });
        await competitionsPage.expectPagination(1, 2);
      });
    },
  );

  test(
    'visitor should see the no-data message when the API returns no competitions',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ mockCompetitions, competitionsPage }) => {
      await test.step('Given the competitions API returns no competitions', async () => {
        await mockCompetitions(emptyPage);
      });

      await test.step('When a visitor opens Competitions', async () => {
        await competitionsPage.goTo();
      });

      await test.step('Then the no-data message is displayed', async () => {
        await competitionsPage.verifyIsLoaded();
        await competitionsPage.expectEmptyStateMessage();
      });
    },
  );

  test(
    'visitor should see a network error message when the competitions request fails',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ mockNetworkError, competitionsPage }) => {
      await test.step('Given the competitions request fails on the network', async () => {
        await mockNetworkError();
      });

      await test.step('When a visitor opens Competitions', async () => {
        await competitionsPage.goTo();
      });

      await test.step('Then a network error message is displayed', async () => {
        await competitionsPage.expectNetworkErrorMessage();
      });
    },
  );

  test(
    'visitor should see a server error message when the competitions API returns a server error',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ mockServerError, competitionsPage }) => {
      await test.step('Given the competitions API returns a server error', async () => {
        await mockServerError();
      });

      await test.step('When a visitor opens Competitions', async () => {
        await competitionsPage.goTo();
      });

      await test.step('Then a server error message is displayed', async () => {
        await competitionsPage.expectServerErrorMessage();
      });
    },
  );
});
