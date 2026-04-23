import { test } from '@shared/fixtures';
import { getGyms, type GymDto } from '@api/features/gyms/gyms.api';
import { expectApi, problemDetailsSchema, rawRequest } from '@api/support/api';

test.describe('Gyms API Acceptance @gyms @api', () => {
  test('GET /api/Gym returns PagedResponse<GymDto> @smoke @acceptance', async ({ apiClient }) => {
    const response = await getGyms(apiClient, { page: 1, pageSize: 25 });

    test.expect(response.pagination.currentPage).toBe(1);
    test.expect(response.pagination.pageSize).toBe(25);
    test.expect(response.data.length).toBeLessThanOrEqual(25);

    for (const gym of response.data) {
      const typedGym: GymDto = gym;
      test.expect(typedGym.name).toBeTruthy();
      test.expect(typedGym.location).toBeTruthy();
      test.expect(Array.isArray(typedGym.offeredClasses)).toBeTruthy();
      test.expect(typeof typedGym.trialOffer.isAvailable).toBe('boolean');
    }
  });

  test('write operation in read-only mode returns RFC 7807 ProblemDetails @acceptance', async ({ apiClient }) => {
    const response = await rawRequest(apiClient, 'POST', '/api/gym', { data: {} });
    const problem = await expectApi(response).status(405).contentType('application/json').body(problemDetailsSchema);
    test.expect(problem.status).toBe(405);
    test.expect(problem.title).toBeTruthy();
    test.expect(problem.type).toMatch(/rfc7231#section-6\.5\.5/);
  });
});
