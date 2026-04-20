import { test } from '@core/fixtures/app-fixtures';
import { bjjEventSchema, expectApi, pagedResponseSchema } from '@shared/api';

test.describe('Events API @events @api', () => {
  test.beforeEach(({ featureFlags }) => {
    test.skip(!featureFlags.BjjEvents, "feature 'BjjEvents' disabled");
  });

  test('GET /api/BjjEvent returns PagedResponse<BjjEventDto> @smoke', async ({ apiClient }) => {
    const response = await apiClient.get('/api/bjjevent', { page: 1, pageSize: 10 });
    const body = await expectApi(response)
      .status(200)
      .contentType('application/json')
      .body(pagedResponseSchema(bjjEventSchema));

    test.expect(body.pagination.currentPage).toBe(1);
    test.expect(body.data.length).toBeLessThanOrEqual(10);
  });
});
