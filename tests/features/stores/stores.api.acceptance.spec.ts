import { test, expect } from '@api/fixtures';
import { storesPageSchema } from '@api/features/stores/stores.schemas';
import { getStores } from '@api/features/stores/stores.service';
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
import { INVALID_INTEGER_QUERY_VALUES, OUT_OF_RANGE_PAGING_VALUES } from '../common/testdata/invalid-values';
import { SEEDED_STORES_BY_NAME } from './seeded';

const FULL_PAGE_SIZE = 100;
const SMALL_PAGE_SIZE = 2;

test.describe('Stores API acceptance', { tag: ['@stores', '@api'] }, () => {
  test(
    'Given stores are published, when a client opens the directory, then each published store is returned with its details',
    { tag: ['@smoke', '@acceptance'] },
    async ({ request }) => {
      const { data } = await getStores(request, storesPageSchema, {
        page: 1,
        pageSize: FULL_PAGE_SIZE,
      });

      expectListingToInclude(data, 'name', SEEDED_STORES_BY_NAME);
    },
  );

  test(
    'Given stores are published, when a client opens the directory, then they are ordered by name',
    { tag: '@acceptance' },
    async ({ request }) => {
      const { data } = await getStores(request, storesPageSchema, {
        page: 1,
        pageSize: FULL_PAGE_SIZE,
      });

      expectRelativeOrder(
        data,
        store => store.name,
        SEEDED_STORES_BY_NAME.map(store => store.name),
      );
    },
  );

  test(
    'Given the directory spans more than one page, when a client pages through it, then each page is a distinct slice with correct links',
    { tag: '@acceptance' },
    async ({ request }) => {
      const firstPage = await test.step('Request page 1 of the directory', () =>
        getStores(request, storesPageSchema, { page: 1, pageSize: SMALL_PAGE_SIZE }));

      const secondPage = await test.step('Request page 2 of the directory', () =>
        getStores(request, storesPageSchema, { page: 2, pageSize: SMALL_PAGE_SIZE }));

      expectConsecutivePagePagination(firstPage, secondPage, SMALL_PAGE_SIZE);
      expectPagesAreDistinct(firstPage, secondPage, store => store.id);
    },
  );

  test.describe('Directory query parameters', () => {
    const malformed = [
      ...INVALID_INTEGER_QUERY_VALUES.map(value => ({ param: 'page', label: 'a non-numeric page', value })),
      ...INVALID_INTEGER_QUERY_VALUES.map(value => ({ param: 'pageSize', label: 'a non-numeric page size', value })),
    ];
    for (const { param, label, value } of malformed) {
      test(
        `Given ${label} "${value}", when a client opens the directory, then the request is rejected as a bad request`,
        { tag: '@acceptance' },
        async ({ request }) => {
          const response = await request.get(API_ROUTES.stores, { params: { [param]: value } });

          await expectProblem(response, 400, ProblemType.BadRequest);
        },
      );
    }

    for (const { param, field, value } of OUT_OF_RANGE_PAGING_VALUES) {
      test(
        `Given ${param} ${value} is out of range, when a client opens the directory, then the request fails validation on ${param}`,
        { tag: '@acceptance' },
        async ({ request }) => {
          const response = await request.get(API_ROUTES.stores, { params: { [param]: value } });

          const problem = await expectProblem(response, 400, ProblemType.Validation);
          expect(problem.errors).toContainEqual(
            expect.objectContaining({ field, errorCode: ValidationErrorCode.ValueOutOfRange }),
          );
        },
      );
    }
  });
});
