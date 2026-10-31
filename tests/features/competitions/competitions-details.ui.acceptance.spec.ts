import { test, competitionsTestConfig } from './fixtures';
import type { CompetitionDto } from '@api/features/competitions/competitions.types';
import { API_ROUTES, DEFAULT_PAGE_SIZE, type PaginatedResponse } from '@api/support';
import type { CompetitionId } from '@shared/types';
import { paginatePages } from '@ui/mocks/paginate.mock';
import { competitionCardFromDto, competitionCardLinksFromDto } from '@ui/pages/competitions/competitions.card.mapper';
import { SEEDED_COMPETITION_DONEGAL_GI_CLASSIC, SEEDED_COMPETITION_DONEGAL_GI_CLASSIC_PARTIAL_NAME } from './seeded';
import competitionsFixture from './testdata/competitions-pagination-page-1.json';
import { squash } from '@squash/annotations';

test.use(competitionsTestConfig);

const seededCompetition = SEEDED_COMPETITION_DONEGAL_GI_CLASSIC;
const seededCompetitionCard = competitionCardFromDto(seededCompetition);
const seededCompetitionPartialName = SEEDED_COMPETITION_DONEGAL_GI_CLASSIC_PARTIAL_NAME;

const PAGINATION_PAGE_SIZE = 10;
const pagedCompetitions = paginatePages(competitionsFixture.data, PAGINATION_PAGE_SIZE, API_ROUTES.competitions);
const secondPageCompetition = competitionsFixture.data
  .slice(PAGINATION_PAGE_SIZE)
  .find(competition => competition.name === 'Grappling Industries Dublin');
if (!secondPageCompetition) {
  throw new Error('competitions-pagination-page-1.json no longer contains the expected page-2 competition');
}

const pageOf = (...competitions: CompetitionDto[]): PaginatedResponse<CompetitionDto> => {
  const page = paginatePages(competitions, DEFAULT_PAGE_SIZE, API_ROUTES.competitions)[1];
  if (!page) throw new Error('no first page');
  return page;
};
const competitionOn = (
  id: string,
  name: string,
  dates: Readonly<{ start: string; end: string; shown: string }>,
): { dto: CompetitionDto; card: { name: string; date: string } } => ({
  dto: { ...seededCompetition, id: id as CompetitionId, slug: name, name, startDate: dates.start, endDate: dates.end },
  card: { name, date: dates.shown },
});
const DATED_COMPETITIONS = [
  competitionOn('aaa000000000000000000001', 'One day', {
    start: '2026-11-15T00:00:00Z',
    end: '2026-11-15T00:00:00Z',
    shown: '15 November 2026',
  }),
  competitionOn('aaa000000000000000000002', 'One month', {
    start: '2026-11-28T00:00:00Z',
    end: '2026-11-29T00:00:00Z',
    shown: '28–29 November 2026',
  }),
  competitionOn('aaa000000000000000000003', 'Two months', {
    start: '2026-06-30T00:00:00Z',
    end: '2026-07-01T00:00:00Z',
    shown: '30 June – 1 July 2026',
  }),
];
const competitionWithUnsafeLinks: CompetitionDto = {
  ...seededCompetition,
  websiteUrl: 'javascript:alert(1)',
  registrationUrl: 'data:text/html,unsafe',
};
const competitionWithHiddenDetails: CompetitionDto = {
  ...seededCompetition,
  description: 'Held in Letterkenny.',
  organisation: 'Tirconaill Grappling',
  country: 'Portugal',
  tags: ['submission-only'],
};
const HIDDEN_SEARCH_TERMS = [
  ['description', 'Letterkenny'],
  ['organisation', 'Tirconaill'],
  ['country', 'Portugal'],
  ['tags', 'submission-only'],
] as const;
const competitionWithDates: CompetitionDto = {
  ...seededCompetition,
  startDate: '2026-11-28T00:00:00Z',
  endDate: '2026-11-29T00:00:00Z',
};

test.describe(
  'Competitions UI acceptance: cards, URL state and search scope',
  { tag: ['@competitions', '@ui', '@desktop', '@squash'] },
  () => {
    test(
      'visitor should see how many competitions were found',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ competitionsPage }) => {
        await test.step('When a visitor opens Competitions', async () => {
          await competitionsPage.goTo();
        });

        await test.step(`And the visitor searches for "${seededCompetitionPartialName}"`, async () => {
          await competitionsPage.searchFor(seededCompetitionPartialName);
        });

        await test.step('Then the page says one competition was found', async () => {
          await competitionsPage.expectHeaderTotal('Found 1 competition.');
        });
      },
    );

    test(
      'visitor should not find a competition by anything other than its name',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ mockCompetitions, competitionsPage }) => {
        await test.step('Given a competition with a description, an organisation, a country and tags', async () => {
          await mockCompetitions(pageOf(competitionWithHiddenDetails));
        });

        await test.step('When a visitor opens Competitions', async () => {
          await competitionsPage.goTo();
        });

        for (const [label, term] of HIDDEN_SEARCH_TERMS) {
          await test.step(`And the visitor searches for a word only in its ${label}`, async () => {
            await competitionsPage.searchFor(term);
          });

          await test.step('Then no competitions are listed', async () => {
            await competitionsPage.expectNoResults();
          });
        }
      },
    );

    test(
      "visitor should reach a competition's website and registration from its card",
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ competitionsPage }) => {
        await test.step('When a visitor opens Competitions', async () => {
          await competitionsPage.goTo();
        });

        await test.step(`And the visitor searches for "${seededCompetition.name}"`, async () => {
          await competitionsPage.searchFor(seededCompetition.name);
        });

        await test.step('Then the card links to its website and registration', async () => {
          await competitionsPage.expectCardLinks(competitionCardLinksFromDto(seededCompetition));
        });
      },
    );

    test(
      "visitor should see a competition's dates on its card",
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ mockCompetitions, competitionsPage }) => {
        await test.step('Given competitions run on one day, within a month and across months', async () => {
          await mockCompetitions(pageOf(...DATED_COMPETITIONS.map(competition => competition.dto)));
        });

        await test.step('When a visitor opens Competitions', async () => {
          await competitionsPage.goTo();
        });

        await test.step('Then each card shows its dates in full', async () => {
          for (const { card } of DATED_COMPETITIONS) {
            await competitionsPage.expectCardData(card);
          }
        });
      },
    );

    test(
      'visitor should see the competition list after retrying when competitions failed to load',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ mockServerErrorOnce, competitionsPage }) => {
        await test.step('Given the competition service is briefly unavailable', async () => {
          await mockServerErrorOnce();
        });

        await test.step('When a visitor opens Competitions', async () => {
          await competitionsPage.goTo();
        });

        await test.step('Then a server error message is displayed', async () => {
          await competitionsPage.expectServerErrorMessage();
        });

        await test.step('When the visitor retries', async () => {
          await competitionsPage.retryAfterError();
        });

        await test.step('Then the competition list is displayed', async () => {
          await competitionsPage.expectListNotEmpty();
        });
      },
    );

    test(
      'visitor should see website unavailable when a competition has no safe links',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ mockCompetitions, competitionsPage }) => {
        await test.step('Given a competition has only unsafe links', async () => {
          await mockCompetitions(pageOf(competitionWithUnsafeLinks));
        });

        await test.step('When a visitor opens Competitions', async () => {
          await competitionsPage.goTo();
        });

        await test.step('Then its card offers no link and says the website is unavailable', async () => {
          await competitionsPage.expectCardLinksUnavailable(competitionWithUnsafeLinks.name);
        });
      },
    );

    test(
      'visitor should see the same page of competitions after reloading',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ mockCompetitionsPages, competitionsPage }) => {
        await test.step('Given the competition list has two pages', async () => {
          await mockCompetitionsPages(pagedCompetitions);
        });

        await test.step('When a visitor opens Competitions', async () => {
          await competitionsPage.goTo();
        });

        await test.step('And the visitor opens the next page', async () => {
          await competitionsPage.goToNextPage();
        });

        await test.step('And the visitor reloads the page', async () => {
          await competitionsPage.reload();
        });

        await test.step('Then the second page is still shown', async () => {
          await competitionsPage.expectPagination(2, 2);
          await competitionsPage.expectCardData({ name: secondPageCompetition.name });
        });
      },
    );

    test(
      'visitor should see the shared search when opening a search link',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ competitionsPage }) => {
        await test.step(`When a visitor opens a link to a search for "${seededCompetitionPartialName}"`, async () => {
          await competitionsPage.goToWithQuery(`q=${encodeURIComponent(seededCompetitionPartialName)}`);
        });

        await test.step('Then the search is filled in', async () => {
          await competitionsPage.expectSearchValue(seededCompetitionPartialName);
        });

        await test.step('And only that competition is listed', async () => {
          await competitionsPage.expectResultCount(1);
          await competitionsPage.expectCardData(seededCompetitionCard);
        });
      },
    );

    test(
      'visitor should see every competition again after clearing the search',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ competitionsPage }) => {
        await test.step(`Given a visitor has searched for "${seededCompetitionPartialName}"`, async () => {
          await competitionsPage.goTo();
          await competitionsPage.searchFor(seededCompetitionPartialName);
          await competitionsPage.expectResultCount(1);
        });

        await test.step('When the visitor clears the search', async () => {
          await competitionsPage.clearSearchWithButton();
        });

        await test.step('Then other competitions are listed again', async () => {
          await competitionsPage.expectSearchValue('');
          await competitionsPage.expectSeveralResults();
        });
      },
    );

    test(
      'visitor should stay in the search box after clearing the search',
      {
        tag: '@acceptance',
        annotation: squash({
          weight: 'medium',
          status: 'work in progress',
          nature: 'non functional',
          type: 'regression',
        }),
      },
      async ({ competitionsPage }) => {
        await test.step(`Given a visitor has searched for "${seededCompetitionPartialName}"`, async () => {
          await competitionsPage.goTo();
          await competitionsPage.searchFor(seededCompetitionPartialName);
        });

        await test.step('When the visitor clears the search', async () => {
          await competitionsPage.clearSearchWithButton();
        });

        await test.step('Then the visitor can type a new search straight away', async () => {
          await competitionsPage.expectSearchFocused();
        });
      },
    );

    test.describe('in a timezone behind Ireland', () => {
      test.use({ timezoneId: 'America/New_York' });

      test(
        "visitor should see a competition's dates in Irish time wherever they are",
        {
          tag: '@acceptance',
          annotation: squash({
            weight: 'medium',
            status: 'work in progress',
            nature: 'functional',
            type: 'regression',
          }),
        },
        async ({ mockCompetitions, competitionsPage }) => {
          await test.step('Given a competition running on two days in Ireland', async () => {
            await mockCompetitions(pageOf(competitionWithDates));
          });

          await test.step('When a visitor behind Ireland opens Competitions', async () => {
            await competitionsPage.goTo();
          });

          await test.step('Then its dates are those of the event in Ireland', async () => {
            await competitionsPage.expectCardData({ name: competitionWithDates.name, date: '28–29 November 2026' });
          });
        },
      );
    });
  },
);
