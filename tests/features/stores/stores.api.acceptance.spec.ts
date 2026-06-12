import { test, expect } from '@api/fixtures';
import { getStores } from '@api/features/stores/stores.api';
import expectedStoresPage1 from '../../testdata/expected/stores.page-1.json';

test.describe('Stores API acceptance', { tag: ['@stores', '@api'] }, () => {
  test(
    'Given stores are published, when a client opens the store directory, then they see the published stores',
    { tag: ['@smoke', '@acceptance'] },
    async ({ apiClient }) => {
      const response = await getStores(apiClient, {
        page: expectedStoresPage1.pagination.currentPage,
        pageSize: expectedStoresPage1.pagination.pageSize,
      });

      expect(response.data).toEqual(expectedStoresPage1.data);
      expect(response.pagination).toMatchObject({
        totalItems: expectedStoresPage1.pagination.totalItems,
        currentPage: expectedStoresPage1.pagination.currentPage,
        pageSize: expectedStoresPage1.pagination.pageSize,
        totalPages: expectedStoresPage1.pagination.totalPages,
        hasNextPage: expectedStoresPage1.pagination.hasNextPage,
        hasPreviousPage: expectedStoresPage1.pagination.hasPreviousPage,
      });
    },
  );

  test(
    'Given the store directory fits on a single page, when a client navigates past the last page, then they see no stores',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const response = await getStores(apiClient, {
        page: 2,
        pageSize: expectedStoresPage1.pagination.pageSize,
      });

      expect(response.data).toEqual([]);
      expect(response.pagination).toMatchObject({
        totalItems: expectedStoresPage1.pagination.totalItems,
        currentPage: 2,
        pageSize: expectedStoresPage1.pagination.pageSize,
        totalPages: expectedStoresPage1.pagination.totalPages,
        hasNextPage: false,
        hasPreviousPage: true,
      });
    },
  );
});
