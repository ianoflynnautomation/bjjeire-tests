import { test } from '@core/fixtures/app-fixtures';
import { competitionSchema, expectApi, pagedResponseSchema } from '@shared/api';

test.describe('Competitions API @competitions @api', () => {
  test('GET /api/Competition returns PagedResponse<CompetitionDto> @smoke', async ({ apiClient }) => {
    const response = await apiClient.get('/api/competition', { page: 1, pageSize: 25 });
    const body = await expectApi(response)
      .status(200)
      .contentType('application/json')
      .body(pagedResponseSchema(competitionSchema));

    test.expect(body.pagination.currentPage).toBe(1);
    test.expect(body.data.length).toBeLessThanOrEqual(25);
  });
});
