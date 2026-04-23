import { test } from '@shared/fixtures';
import { getStores, type StoreDto } from '@api/features/stores/stores.api';

test.describe('Stores API Acceptance @stores @api', () => {
  test('GET /api/Store returns PagedResponse<StoreDto> @smoke @acceptance', async ({ apiClient }) => {
    const response = await getStores(apiClient, { page: 1, pageSize: 25 });

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
