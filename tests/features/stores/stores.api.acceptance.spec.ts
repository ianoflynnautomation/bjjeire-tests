// spec: specs/features/shop.md
import { test, expect } from '@api/fixtures';
import { storesPageSchema } from '@api/features/stores/stores.schemas';
import { getAllStores, getSitemapPaths, getStores } from '@api/features/stores/stores.service';
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
import { SEEDED_STORE_BURREN_MATS, SEEDED_STORE_FASTNET_GRAPPLING_CO, SEEDED_STORES_BY_NAME } from './seeded';
import { squash } from '@squash/annotations';

const FULL_PAGE_SIZE = 100;
const SMALL_PAGE_SIZE = 2;
const PAGE_PAST_THE_END = 10000;
const PAST_THE_END_PAGE_SIZE = 20;

test.describe('Stores API acceptance', { tag: ['@stores', '@api', '@squash'] }, () => {
  test(
    'client should receive each published store with its details',
    {
      tag: ['@smoke', '@acceptance'],
      annotation: squash({ weight: 'high', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ request }) => {
      const { data } = await test.step('When a client requests the store directory', () =>
        getStores(request, storesPageSchema, {
          page: 1,
          pageSize: FULL_PAGE_SIZE,
        }));

      await test.step('Then every seeded store is listed with its details', () => {
        expectListingToInclude(data, 'name', SEEDED_STORES_BY_NAME);
      });
    },
  );

  test(
    'client should receive stores ordered by name',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ request }) => {
      const { data } = await test.step('When a client requests the store directory', () =>
        getStores(request, storesPageSchema, {
          page: 1,
          pageSize: FULL_PAGE_SIZE,
        }));

      await test.step('Then the seeded stores appear in name order', () => {
        expectRelativeOrder(
          data,
          store => store.name,
          SEEDED_STORES_BY_NAME.map(store => store.name),
        );
      });
    },
  );

  test(
    'client should page through the directory in distinct slices with correct links',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ request }) => {
      const firstPage = await test.step('When a client requests page 1 of the directory', () =>
        getStores(request, storesPageSchema, { page: 1, pageSize: SMALL_PAGE_SIZE }));

      const secondPage = await test.step('And the client requests page 2 of the directory', () =>
        getStores(request, storesPageSchema, { page: 2, pageSize: SMALL_PAGE_SIZE }));

      await test.step('Then the two pages hold different entries and link to each other', () => {
        expectConsecutivePagePagination(firstPage, secondPage, SMALL_PAGE_SIZE);
        expectPagesAreDistinct(firstPage, secondPage, store => store.id);
      });
    },
  );

  test(
    'client should receive an empty page when asking past the last page of the directory',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ request }) => {
      const pastTheEnd = await test.step('When a client requests a page far past the last one', () =>
        getStores(request, storesPageSchema, { page: PAGE_PAST_THE_END, pageSize: PAST_THE_END_PAGE_SIZE }));

      await test.step('Then the page has no stores', () => {
        expect(pastTheEnd.data).toHaveLength(0);
      });

      await test.step('And it reports no next page', () => {
        expect(pastTheEnd.pagination.hasNextPage).toBe(false);
      });

      await test.step('And it reports a previous page', () => {
        expect(pastTheEnd.pagination.hasPreviousPage).toBe(true);
      });
    },
  );

  test(
    'client should find the Shop address and no Stores address in the site map',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ request }) => {
      const paths = await test.step('When a client requests the site map from the app', () => getSitemapPaths(request));

      await test.step('Then it lists the Shop address', () => {
        expect(paths).toContain('/shop');
      });

      await test.step('And it lists no address under the old Stores one', () => {
        expect(paths.filter(path => path === '/stores' || path.startsWith('/stores/'))).toEqual([]);
      });
    },
  );

  test(
    'client should not receive an unpublished store in the directory',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ request }) => {
      const { stores, reportedTotal } =
        await test.step('When a client requests the store directory, page by page to the end', () =>
          getAllStores(request, storesPageSchema));

      await test.step('Then no store has the unpublished store id', () => {
        expect(stores.map(store => store.id)).not.toContain(SEEDED_STORE_FASTNET_GRAPPLING_CO.id);
      });

      await test.step('And no store has the unpublished store name', () => {
        expect(stores.map(store => store.name)).not.toContain(SEEDED_STORE_FASTNET_GRAPPLING_CO.name);
      });

      await test.step('And every store the directory reported was received', () => {
        expect(stores).toHaveLength(reportedTotal);
      });

      await test.step('And the published store seeded alongside it is listed', () => {
        expect(stores.map(store => store.id)).toContain(SEEDED_STORE_BURREN_MATS.id);
      });
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
          const response = await test.step(`When a client requests the store directory with ${label} "${value}"`, () =>
            request.get(API_ROUTES.stores, { params: { [param]: value } }));

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
          const response = await test.step(`When a client requests the store directory with ${param} ${value}`, () =>
            request.get(API_ROUTES.stores, { params: { [param]: value } }));

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
