import { test } from '@fixtures/base';
import { expectApi, gymSchema, pagedResponseSchema, problemDetailsSchema } from '@lib/api';

test.describe('Gyms API @gyms @api', () => {
  test('GET /api/Gym returns PagedResponse<GymDto> @smoke', async ({ apiClient }) => {
    const response = await apiClient.get('/api/gym', { page: 1, pageSize: 25 });
    const body = await expectApi(response)
      .status(200)
      .contentType('application/json')
      .body(pagedResponseSchema(gymSchema));

    test.expect(body.pagination.currentPage).toBe(1);
    test.expect(body.pagination.pageSize).toBe(25);
    test.expect(body.data.length).toBeLessThanOrEqual(25);
  });

  test('write operation in read-only mode returns RFC 7807 ProblemDetails @regression', async ({ apiClient }) => {
    const response = await apiClient.post('/api/gym', {});
    const problem = await expectApi(response).status(405).contentType('application/json').body(problemDetailsSchema);
    test.expect(problem.status).toBe(405);
    test.expect(problem.title).toBeTruthy();
    test.expect(problem.type).toMatch(/rfc7231#section-6\.5\.5/);
  });
});
