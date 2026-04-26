import { test, expect } from '@shared/fixtures';
import { getGyms } from '@api/features/gyms/gyms.api';
import { expectApi, problemDetailsSchema, rawRequest } from '@api/support/api';
import { expectPaginatedResponse } from '../../shared/pagination-contract';

test.describe('Gyms API Acceptance', { tag: ['@gyms', '@api'] }, () => {
  test('GET /api/v1/Gym returns PagedResponse<GymDto>', { tag: ['@smoke', '@acceptance'] }, async ({ apiClient }) => {
    const response = await getGyms(apiClient, { page: 1, pageSize: 25 });
    expectPaginatedResponse(response, { page: 1, pageSize: 25 });
    expect(response.data[0]?.name).toBeTruthy();
  });

  test(
    'write operation in read-only mode returns RFC 7807 ProblemDetails',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const response = await rawRequest(apiClient, 'POST', '/api/v1/gym', { data: {} });
      const problem = await expectApi(response).status(405).contentType('application/json').body(problemDetailsSchema);
      expect(problem.status).toBe(405);
      expect(problem.title).toBeTruthy();
      expect(problem.type).toMatch(/rfc7231#section-6\.5\.5/);
    },
  );
});
