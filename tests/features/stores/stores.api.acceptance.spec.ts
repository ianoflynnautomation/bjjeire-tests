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
import { squash } from '@squash/annotations';

const FULL_PAGE_SIZE = 100;
const SMALL_PAGE_SIZE = 2;

test.describe('Stores API acceptance', { tag: ['@stores', '@api', '@squash'] }, () => {
  test(
    'client should receive each published store with its details',
    {
      tag: ['@smoke', '@acceptance'],
      annotation: squash({ weight: 'high', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ request }) => {
      const { data } = await getStores(request, storesPageSchema, {
        page: 1,
        pageSize: FULL_PAGE_SIZE,
      });

      expectListingToInclude(data, 'name', SEEDED_STORES_BY_NAME);
    },
  );

  test(
    'client should receive stores ordered by name',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
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
    'client should page through the directory in distinct slices with correct links',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
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
        `client should get a bad request for ${label} "${value}"`,
        {
          tag: '@acceptance',
          annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
        },
        async ({ request }) => {
          const response = await request.get(API_ROUTES.stores, { params: { [param]: value } });

          await expectProblem(response, 400, ProblemType.BadRequest);
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
