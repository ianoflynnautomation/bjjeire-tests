import { test } from '@core/fixtures/app-fixtures';
import { expectApi, pagedResponseSchema, storeSchema } from '@shared/api';

test.describe('Stores API @stores @api', () => {
  test('GET /api/Store returns PagedResponse<StoreDto> @smoke', async ({ apiClient }) => {
    const response = await apiClient.get('/api/store', { page: 1, pageSize: 25 });
    const body = await expectApi(response)
      .status(200)
      .contentType('application/json')
      .body(pagedResponseSchema(storeSchema));

    test.expect(body.pagination.currentPage).toBe(1);
    test.expect(body.data.length).toBeLessThanOrEqual(25);
  });
});
