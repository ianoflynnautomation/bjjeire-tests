import { test } from '@api/fixtures/app-fixtures';
import { getStores, type StoreDto } from '@api/features/stores/stores.api';

test.describe('Stores API @stores @api', () => {
  test('GET /api/Store returns PagedResponse<StoreDto> @smoke', async ({ request }) => {
    const response = await getStores(request, { page: 1, pageSize: 25 });

    test.expect(response.pagination.currentPage).toBe(1);
    test.expect(response.pagination.pageSize).toBe(25);
    test.expect(response.data.length).toBeLessThanOrEqual(25);

    for (const store of response.data) {
      const typedStore: StoreDto = store;
      test.expect(typedStore.name).toBeTruthy();
      test.expect(typedStore.websiteUrl).toBeTruthy();
      test.expect(typeof typedStore.isActive).toBe('boolean');
    }
  });
});
