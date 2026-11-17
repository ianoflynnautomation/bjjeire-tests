// spec: specs/features/competitions.md
import { test, expect } from '@api/fixtures';
import { competitionsPageSchema } from '@api/features/competitions/competitions.schemas';
import { getCompetitions } from '@api/features/competitions/competitions.service';
import {
  API_BASE_PATH,
  API_ROUTES,
  expectConsecutivePagePagination,
  expectListingToInclude,
  expectPagesAreDistinct,
  expectProblem,
  expectRelativeOrder,
  problemDetailSchema,
  ProblemType,
  ValidationErrorCode,
} from '@api/support';
import {
  INVALID_BOOLEAN_QUERY_VALUES,
  INVALID_INTEGER_QUERY_VALUES,
  OUT_OF_RANGE_PAGING_VALUES,
} from '../common/testdata/invalid-values';
import { SEEDED_COMPETITION_FINISHED_KERRY_COAST, SEEDED_COMPETITIONS_BY_START_DATE } from './seeded';
import { squash } from '@squash/annotations';

const FULL_PAGE_SIZE = 50;
const SMALL_PAGE_SIZE = 2;

/** The BJJ Éire competitions API's address before ADR-0015; it must answer as an address that never existed (`#3016`). */
const RETIRED_API_ROUTE = `${API_BASE_PATH}/tournament`;

test.describe('Competitions API acceptance', { tag: ['@competitions', '@api', '@squash'] }, () => {
  test(
    'client should receive each published competition with its details',
    {
      tag: ['@smoke', '@acceptance'],
      annotation: squash({ weight: 'high', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ request }) => {
      const { data } = await test.step('When a client requests the competition listing', () =>
        getCompetitions(request, competitionsPageSchema, {
          page: 1,
          pageSize: FULL_PAGE_SIZE,
        }));

      await test.step('Then every seeded competition is listed with its details', () => {
        expectListingToInclude(data, 'slug', SEEDED_COMPETITIONS_BY_START_DATE);
      });
    },
  );

  test(
    'client should not receive finished competitions',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ request }) => {
      const { data } = await test.step('When a client requests the competition listing', () =>
        getCompetitions(request, competitionsPageSchema, {
          page: 1,
          pageSize: FULL_PAGE_SIZE,
        }));

      await test.step(`Then the finished competition "${SEEDED_COMPETITION_FINISHED_KERRY_COAST.name}" is not listed`, () => {
        expect(data.map(competition => competition.slug)).not.toContain(SEEDED_COMPETITION_FINISHED_KERRY_COAST.slug);
      });
    },
  );

  test(
    'client should receive competitions ordered by start date',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ request }) => {
      const { data } = await test.step('When a client requests the competition listing', () =>
        getCompetitions(request, competitionsPageSchema, {
          page: 1,
          pageSize: FULL_PAGE_SIZE,
        }));

      await test.step('Then the seeded competitions appear in start-date order', () => {
        expectRelativeOrder(
          data,
          competition => competition.slug,
          SEEDED_COMPETITIONS_BY_START_DATE.map(competition => competition.slug),
        );
      });
    },
  );

  test(
    'client should page through the listing in distinct slices with correct links',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ request }) => {
      const firstPage = await test.step('When a client requests page 1 of the listing', () =>
        getCompetitions(request, competitionsPageSchema, { page: 1, pageSize: SMALL_PAGE_SIZE }));

      const secondPage = await test.step('And the client requests page 2 of the listing', () =>
        getCompetitions(request, competitionsPageSchema, { page: 2, pageSize: SMALL_PAGE_SIZE }));

      await test.step('Then the two pages hold different entries and link to each other', () => {
        expectConsecutivePagePagination(firstPage, secondPage, SMALL_PAGE_SIZE);
        expectPagesAreDistinct(firstPage, secondPage, competition => competition.slug);
      });
    },
  );

  test(
    'client should receive finished competitions when asking to include inactive ones',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ request }) => {
      const { data } = await test.step('When a client requests the listing including inactive competitions', () =>
        getCompetitions(request, competitionsPageSchema, {
          page: 1,
          pageSize: FULL_PAGE_SIZE,
          includeInactive: true,
        }));

      await test.step(`Then the finished competition "${SEEDED_COMPETITION_FINISHED_KERRY_COAST.name}" is listed`, () => {
        expect(data.map(competition => competition.slug)).toContain(SEEDED_COMPETITION_FINISHED_KERRY_COAST.slug);
      });
    },
  );

  test(
    'client should receive an empty page with valid pagination for a page beyond the last',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ request }) => {
      const beyondLastPage = 999;

      const { data, pagination } =
        await test.step('When a client requests a page beyond the last page of the listing', () =>
          getCompetitions(request, competitionsPageSchema, { page: beyondLastPage, pageSize: SMALL_PAGE_SIZE }));

      await test.step('Then the page is empty and its pagination points back, not forward', () => {
        expect(data).toEqual([]);
        expect(pagination).toMatchObject({
          currentPage: beyondLastPage,
          pageSize: SMALL_PAGE_SIZE,
          hasNextPage: false,
          hasPreviousPage: true,
        });
        expect(pagination.nextPageUrl).toBeNull();
      });
    },
  );

  test(
    'client should get the same answer at a retired API route as at a route that never existed',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ request }) => {
      const [retired, unknown] =
        await test.step('When a client calls a retired competitions route and a route that never existed with no token', () =>
          Promise.all([
            request.get(RETIRED_API_ROUTE, { maxRedirects: 0 }),
            request.get(API_ROUTES.noSuchFeature, { maxRedirects: 0 }),
          ]));

      await test.step('Then both answers have the same status and the retired route does not succeed', () => {
        expect(retired.status()).toBe(unknown.status());
        expect(retired.ok()).toBe(false);
      });

      await test.step('And both answers are the same problem document', async () => {
        expect(retired.headers()['content-type']).toBe(unknown.headers()['content-type']);
        const retiredProblem = problemDetailSchema.parse(await retired.json());
        const unknownProblem = problemDetailSchema.parse(await unknown.json());
        expect(retiredProblem).toMatchObject({
          type: unknownProblem.type,
          title: unknownProblem.title,
          status: unknownProblem.status,
        });
      });

      await test.step('And neither redirects', () => {
        expect(retired.headers()['location']).toBeUndefined();
        expect(unknown.headers()['location']).toBeUndefined();
      });
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
        `client should get a bad request for ${label} "${value}"`,
        {
          tag: '@acceptance',
          annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
        },
        async ({ request }) => {
          const response =
            await test.step(`When a client requests the competition listing with ${label} "${value}"`, () =>
              request.get(API_ROUTES.competitions, { params: { [param]: value } }));

          await test.step('Then the request is rejected as a bad request', async () => {
            await expectProblem(response, 400, ProblemType.BadRequest);
          });
        },
      );
    }

    for (const { param, field, value } of OUT_OF_RANGE_PAGING_VALUES) {
      test(
        `client should get a validation error on ${param} when ${param} ${value} is out of range`,
        {
          tag: '@acceptance',
          annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
        },
        async ({ request }) => {
          const response =
            await test.step(`When a client requests the competition listing with ${param} ${value}`, () =>
              request.get(API_ROUTES.competitions, { params: { [param]: value } }));

          await test.step(`Then the request is rejected because ${param} is out of range`, async () => {
            const problem = await expectProblem(response, 400, ProblemType.Validation);
            expect(problem.errors).toContainEqual(
              expect.objectContaining({ field, errorCode: ValidationErrorCode.ValueOutOfRange }),
            );
          });
        },
      );
    }
  });
});
