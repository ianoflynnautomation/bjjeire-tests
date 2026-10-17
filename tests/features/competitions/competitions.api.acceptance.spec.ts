import { test, expect } from '@api/fixtures';
import { competitionsPageSchema } from '@api/features/competitions/competitions.schemas';
import { getCompetitions } from '@api/features/competitions/competitions.service';
import {
  API_ROUTES,
  expectConsecutivePagePagination,
  expectListingToInclude,
  expectPagesAreDistinct,
  expectProblem,
  expectRelativeOrder,
  ProblemType,
  ValidationErrorCode,
} from '@api/support';
import {
  INVALID_BOOLEAN_QUERY_VALUES,
  INVALID_INTEGER_QUERY_VALUES,
  OUT_OF_RANGE_PAGING_VALUES,
} from '../common/testdata/invalid-values';
import { SEEDED_COMPETITION_FINISHED_KERRY_COAST, SEEDED_COMPETITIONS_BY_START_DATE } from './seeded';

const FULL_PAGE_SIZE = 50;
const SMALL_PAGE_SIZE = 2;

test.describe('Competitions API acceptance', { tag: ['@competitions', '@api'] }, () => {
  test(
    'Given competitions are published, when a client opens the listing, then each published competition is returned with its details',
    { tag: ['@smoke', '@acceptance'] },
    async ({ request }) => {
      const { data } = await getCompetitions(request, competitionsPageSchema, {
        page: 1,
        pageSize: FULL_PAGE_SIZE,
      });

      expectListingToInclude(data, 'slug', SEEDED_COMPETITIONS_BY_START_DATE);
    },
  );

  test(
    'Given a competition has finished, when a client opens the listing, then it is not shown',
    { tag: '@acceptance' },
    async ({ request }) => {
      const { data } = await getCompetitions(request, competitionsPageSchema, {
        page: 1,
        pageSize: FULL_PAGE_SIZE,
      });

      expect(data.map(competition => competition.slug)).not.toContain(SEEDED_COMPETITION_FINISHED_KERRY_COAST.slug);
    },
  );

  test(
    'Given several competitions are published, when a client opens the listing, then they are ordered by start date',
    { tag: '@acceptance' },
    async ({ request }) => {
      const { data } = await getCompetitions(request, competitionsPageSchema, {
        page: 1,
        pageSize: FULL_PAGE_SIZE,
      });

      expectRelativeOrder(
        data,
        competition => competition.slug,
        SEEDED_COMPETITIONS_BY_START_DATE.map(competition => competition.slug),
      );
    },
  );

  test(
    'Given the listing spans more than one page, when a client pages through it, then each page is a distinct slice with correct links',
    { tag: '@acceptance' },
    async ({ request }) => {
      const firstPage = await test.step('Request page 1 of the listing', () =>
        getCompetitions(request, competitionsPageSchema, { page: 1, pageSize: SMALL_PAGE_SIZE }));

      const secondPage = await test.step('Request page 2 of the listing', () =>
        getCompetitions(request, competitionsPageSchema, { page: 2, pageSize: SMALL_PAGE_SIZE }));

      expectConsecutivePagePagination(firstPage, secondPage, SMALL_PAGE_SIZE);
      expectPagesAreDistinct(firstPage, secondPage, competition => competition.slug);
    },
  );

  test.describe('Listing query parameters', () => {
    const malformed = [
      ...INVALID_BOOLEAN_QUERY_VALUES.map(value => ({ param: 'includeInactive', label: 'a non-boolean flag', value })),
      ...INVALID_INTEGER_QUERY_VALUES.map(value => ({ param: 'page', label: 'a non-numeric page', value })),
      ...INVALID_INTEGER_QUERY_VALUES.map(value => ({ param: 'pageSize', label: 'a non-numeric page size', value })),
    ];
    for (const { param, label, value } of malformed) {
      test(
        `Given ${label} "${value}", when a client opens the listing, then the request is rejected as a bad request`,
        { tag: '@acceptance' },
        async ({ request }) => {
          const response = await request.get(API_ROUTES.competitions, { params: { [param]: value } });

          await expectProblem(response, 400, ProblemType.BadRequest);
        },
      );
    }

    for (const { param, field, value } of OUT_OF_RANGE_PAGING_VALUES) {
      test(
        `Given ${param} ${value} is out of range, when a client opens the listing, then the request fails validation on ${param}`,
        { tag: '@acceptance' },
        async ({ request }) => {
          const response = await request.get(API_ROUTES.competitions, { params: { [param]: value } });

          const problem = await expectProblem(response, 400, ProblemType.Validation);
          expect(problem.errors).toContainEqual(
            expect.objectContaining({ field, errorCode: ValidationErrorCode.ValueOutOfRange }),
          );
        },
      );
    }
  });
});
