// spec: specs/features/competitions.md
// seed: tests/agents/seed.spec.ts
import { test, competitionsTestConfig } from './fixtures';
import { faker } from '@faker-js/faker';
import { API_ROUTES } from '@api/support';
import { emptyPage } from '../common/testdata/mocks/empty-page';
import { paginatePages } from '@ui/mocks/paginate.mock';
import { SEEDED_FEATURED_COMPETITIONS } from './seeded';
import featuredFixture from './testdata/bjjeire-competition-featured.json';
import competitionsFixture from './testdata/competitions-pagination-page-1.json';
import { squash } from '@squash/annotations';

test.use(competitionsTestConfig);

const PAGINATION_PAGE_SIZE = 10;
const pagedCompetitions = paginatePages(competitionsFixture.data, PAGINATION_PAGE_SIZE, API_ROUTES.competitions);
const [featuredCompetition] = featuredFixture.data;
if (!featuredCompetition) {
  throw new Error('bjjeire-competition-featured.json holds no featured competition');
}
const secondPageCompetition = competitionsFixture.data
  .slice(PAGINATION_PAGE_SIZE)
  .find(competition => competition.name === 'Grappling Industries Dublin');
if (!secondPageCompetition) {
  throw new Error('competitions-pagination-page-1.json no longer contains the expected page-2 competition');
}

test.describe(
  'Competitions featured BJJ Éire UI acceptance',
  { tag: ['@competitions', '@ui', '@desktop', '@squash'] },
  () => {
    test(
      'visitor should see upcoming BJJ Éire competitions featured above the competition list',
      {
        tag: ['@smoke', '@acceptance', '@bjjeire-competitions-on'],
        annotation: squash({ weight: 'high', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ competitionsPage }) => {
        await test.step('When a visitor opens Competitions', async () => {
          await competitionsPage.goTo();
        });

        await test.step('Then a "BJJ Éire competitions" section appears above the search box', async () => {
          await competitionsPage.expectFeaturedAboveSearch();
        });

        await test.step('And it shows the three seeded BJJ Éire competitions, earliest day first', async () => {
          await competitionsPage.expectFeaturedOrder(SEEDED_FEATURED_COMPETITIONS.map(c => c.name));
        });

        await test.step('And each card shows its day, venue, fee in euro and five divisions', async () => {
          for (const featured of SEEDED_FEATURED_COMPETITIONS) {
            await competitionsPage.expectFeaturedDetails(featured);
          }
        });

        await test.step('And the cards say Open, Not open yet and Closed respectively', async () => {
          for (const featured of SEEDED_FEATURED_COMPETITIONS) {
            await competitionsPage.expectFeaturedStatus(featured.name, featured.status);
          }
        });
      },
    );

    test(
      'visitor should see no featured section when no BJJ Éire competition is upcoming',
      {
        tag: ['@acceptance', '@bjjeire-competitions-on'],
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ mockBjjEireCompetitions, competitionsPage }) => {
        await test.step('Given no BJJ Éire competition is upcoming', async () => {
          await mockBjjEireCompetitions(emptyPage);
        });

        await test.step('When a visitor opens Competitions', async () => {
          await competitionsPage.goToAwaitingFeatured();
        });

        await test.step('Then the competition list shows as before', async () => {
          await competitionsPage.expectListNotEmpty();
        });

        await test.step('And there is no "BJJ Éire competitions" section and no empty placeholder', async () => {
          await competitionsPage.expectNoFeaturedSection();
        });
      },
    );

    test(
      'visitor should keep the featured BJJ Éire competitions while searching the competition list',
      {
        tag: ['@acceptance', '@bjjeire-competitions-on'],
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ competitionsPage }) => {
        await test.step('When a visitor opens Competitions', async () => {
          await competitionsPage.goTo();
        });

        await test.step('And the visitor searches for a name that matches no directory competition', async () => {
          await competitionsPage.searchFor(faker.string.alphanumeric({ length: 12 }));
        });

        await test.step('Then the list shows its no-results message', async () => {
          await competitionsPage.expectNoResults();
        });

        await test.step('And the three featured BJJ Éire competitions are still shown', async () => {
          await competitionsPage.expectFeaturedOrder(SEEDED_FEATURED_COMPETITIONS.map(c => c.name));
        });
      },
    );

    test(
      'visitor should still see the competition list when BJJ Éire competitions cannot be loaded',
      {
        tag: ['@acceptance', '@bjjeire-competitions-on'],
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ mockBjjEireCompetitionsServerError, competitionsPage }) => {
        await test.step('Given BJJ Éire competitions fail to load', async () => {
          await mockBjjEireCompetitionsServerError();
        });

        await test.step('When a visitor opens Competitions', async () => {
          await competitionsPage.goToAwaitingFeatured();
        });

        await test.step('Then the competition list shows the seeded directory competitions', async () => {
          await competitionsPage.expectListNotEmpty();
        });

        await test.step('And there is no featured section and no error message for it', async () => {
          await competitionsPage.expectNoFeaturedSection();
          await competitionsPage.expectNoErrorMessage();
        });
      },
    );

    test(
      'visitor should keep the featured BJJ Éire competitions while paging the competition list',
      {
        tag: ['@acceptance', '@bjjeire-competitions-on'],
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ mockBjjEireCompetitions, mockCompetitionsPages, competitionsPage }) => {
        let featuredRequestCount: () => number = () => 0;

        await test.step('Given the competition list has two pages and a BJJ Éire competition is upcoming', async () => {
          await mockCompetitionsPages(pagedCompetitions);
          await mockBjjEireCompetitions(featuredFixture);
          featuredRequestCount = competitionsPage.countFeaturedRequests();
        });

        await test.step('When a visitor opens Competitions', async () => {
          await competitionsPage.goTo();
        });

        await test.step('And the visitor opens the next page', async () => {
          await competitionsPage.goToNextPage();
        });

        await test.step('Then the second page of the list is shown', async () => {
          await competitionsPage.expectCardData({ name: secondPageCompetition.name });
          await competitionsPage.expectPagination(2, 2);
        });

        await test.step('And the featured BJJ Éire competition is still shown', async () => {
          await competitionsPage.expectFeaturedOrder([featuredCompetition.name]);
        });

        await test.step('And the featured BJJ Éire competitions are not loaded again', () => {
          competitionsPage.expectFeaturedLoadedOnce(featuredRequestCount);
        });
      },
    );
  },
);
