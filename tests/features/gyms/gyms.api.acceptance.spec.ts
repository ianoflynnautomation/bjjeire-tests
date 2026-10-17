import { test, expect } from '@api/fixtures';
import { gymSchema, gymsPageSchema } from '@api/features/gyms/gyms.schemas';
import { getGymById, getGyms } from '@api/features/gyms/gyms.service';
import {
  API_ROUTES,
  County,
  expectAllFromCounty,
  expectConsecutivePagePagination,
  expectListingToInclude,
  expectPagesAreDistinct,
  expectProblem,
  expectRelativeOrder,
  ProblemType,
  resourcePath,
  ValidationErrorCode,
} from '@api/support';
import {
  INVALID_ENUM_QUERY_VALUES,
  INVALID_INTEGER_QUERY_VALUES,
  INVALID_OBJECT_ID_VALUES,
  OUT_OF_RANGE_PAGING_VALUES,
  UNPUBLISHED_OBJECT_ID,
} from '../common/testdata/invalid-values';
import { SEEDED_GYM_BLACKWATER_VALLEY, SEEDED_GYM_BLACKWATER_VALLEY_ID, SEEDED_GYMS_BY_NAME } from './seeded';

const FULL_PAGE_SIZE = 100;
const SMALL_PAGE_SIZE = 10;

test.describe('Gyms API acceptance', { tag: ['@gyms', '@api'] }, () => {
  test(
    'Given gyms are published, when a client opens the directory, then each published gym is returned with its details',
    { tag: ['@smoke', '@acceptance'] },
    async ({ request }) => {
      const { data } = await getGyms(request, gymsPageSchema, {
        page: 1,
        pageSize: FULL_PAGE_SIZE,
      });

      expectListingToInclude(data, 'name', SEEDED_GYMS_BY_NAME);
    },
  );

  test(
    'Given gyms are published, when a client filters by county, then only gyms from that county are returned',
    { tag: '@acceptance' },
    async ({ request }) => {
      const county = County.Cork;
      const corkGyms = SEEDED_GYMS_BY_NAME.filter(gym => gym.county === county);

      const { data } = await getGyms(request, gymsPageSchema, {
        county,
        page: 1,
        pageSize: FULL_PAGE_SIZE,
      });

      expectAllFromCounty(data, county);
      expectListingToInclude(data, 'name', corkGyms);
    },
  );

  test(
    'Given gyms are published, when a client opens the directory, then they are ordered by name',
    { tag: '@acceptance' },
    async ({ request }) => {
      const { data } = await getGyms(request, gymsPageSchema, {
        page: 1,
        pageSize: FULL_PAGE_SIZE,
      });

      expectRelativeOrder(
        data,
        gym => gym.name,
        SEEDED_GYMS_BY_NAME.map(gym => gym.name),
      );
    },
  );

  test(
    'Given the directory spans more than one page, when a client pages through it, then each page is a distinct slice with correct links',
    { tag: '@acceptance' },
    async ({ request }) => {
      const firstPage = await test.step('Request page 1 of the directory', () =>
        getGyms(request, gymsPageSchema, { page: 1, pageSize: SMALL_PAGE_SIZE }));

      const secondPage = await test.step('Request page 2 of the directory', () =>
        getGyms(request, gymsPageSchema, { page: 2, pageSize: SMALL_PAGE_SIZE }));

      expectConsecutivePagePagination(firstPage, secondPage, SMALL_PAGE_SIZE);
      expectPagesAreDistinct(firstPage, secondPage, gym => gym.id);
    },
  );

  test(
    'Given a page beyond the last, when a client requests it, then an empty page with valid pagination is returned',
    { tag: '@acceptance' },
    async ({ request }) => {
      const beyondLastPage = 999;

      const { data, pagination } = await getGyms(request, gymsPageSchema, {
        page: beyondLastPage,
        pageSize: SMALL_PAGE_SIZE,
      });

      expect(data).toEqual([]);
      expect(pagination).toMatchObject({
        currentPage: beyondLastPage,
        pageSize: SMALL_PAGE_SIZE,
        hasNextPage: false,
        hasPreviousPage: true,
      });
      expect(pagination.nextPageUrl).toBeNull();
    },
  );

  test.describe('Directory query parameters', () => {
    const malformed = [
      ...INVALID_ENUM_QUERY_VALUES.map(value => ({ param: 'county', label: 'an unknown county', value })),
      ...INVALID_INTEGER_QUERY_VALUES.map(value => ({ param: 'page', label: 'a non-numeric page', value })),
      ...INVALID_INTEGER_QUERY_VALUES.map(value => ({ param: 'pageSize', label: 'a non-numeric page size', value })),
    ];
    for (const { param, label, value } of malformed) {
      test(
        `Given ${label} "${value}", when a client opens the directory, then the request is rejected as a bad request`,
        { tag: '@acceptance' },
        async ({ request }) => {
          const response = await request.get(API_ROUTES.gyms, { params: { [param]: value } });

          await expectProblem(response, 400, ProblemType.BadRequest);
        },
      );
    }

    for (const { param, field, value } of OUT_OF_RANGE_PAGING_VALUES) {
      test(
        `Given ${param} ${value} is out of range, when a client opens the directory, then the request fails validation on ${param}`,
        { tag: '@acceptance' },
        async ({ request }) => {
          const response = await request.get(API_ROUTES.gyms, { params: { [param]: value } });

          const problem = await expectProblem(response, 400, ProblemType.Validation);
          expect(problem.errors).toContainEqual(
            expect.objectContaining({ field, errorCode: ValidationErrorCode.ValueOutOfRange }),
          );
        },
      );
    }
  });

  test.describe('Gym details', () => {
    test(
      'Given a published gym, when a client opens it by id, then its details are returned',
      { tag: '@acceptance' },
      async ({ request }) => {
        const gym = await getGymById(request, gymSchema, SEEDED_GYM_BLACKWATER_VALLEY_ID);

        expect(gym).toMatchObject(SEEDED_GYM_BLACKWATER_VALLEY);
      },
    );

    test(
      'Given no gym has the id, when a client opens it, then the gym is not found',
      { tag: '@acceptance' },
      async ({ request }) => {
        const response = await request.get(resourcePath(API_ROUTES.gyms, UNPUBLISHED_OBJECT_ID));

        await expectProblem(response, 404, ProblemType.NotFound);
      },
    );

    for (const { description, value } of INVALID_OBJECT_ID_VALUES) {
      test(
        `Given a gym id that is ${description}, when a client opens it, then the request fails validation on the id`,
        { tag: '@acceptance' },
        async ({ request }) => {
          const response = await request.get(resourcePath(API_ROUTES.gyms, value));

          const problem = await expectProblem(response, 400, ProblemType.Validation);
          expect(problem.errors).toContainEqual(
            expect.objectContaining({ field: 'Id', errorCode: ValidationErrorCode.InvalidFormat }),
          );
        },
      );
    }
  });
});
