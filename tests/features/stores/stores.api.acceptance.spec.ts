import { test, expect } from '@shared/fixtures';
import { getStores } from '@api/features/stores/stores.api';
import { expectPaginatedResponse } from '../../shared/pagination-contract';

test.describe('Stores API Acceptance', { tag: ['@stores', '@api'] }, () => {
  test(
    'GET /api/v1/Store returns PagedResponse<StoreDto>',
    { tag: ['@smoke', '@acceptance'] },
    async ({ apiClient }) => {
      const response = await getStores(apiClient, { page: 1, pageSize: 25 });
      expectPaginatedResponse(response, { page: 1, pageSize: 25 });
      expect(response.data[0]?.name).toBeTruthy();
    },
  );
});
