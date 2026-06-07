import { test, expect } from '@api/fixtures';
import { getStores } from '@api/features/stores/stores.api';
import expectedStoresPage1 from '../../testdata/mocks/stores.page-1.json';

test.describe('Stores API acceptance', { tag: ['@stores', '@api'] }, () => {
  test(
    'Given available stores, when a client requests the first page, then the expected stores and pagination are returned',
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
});
