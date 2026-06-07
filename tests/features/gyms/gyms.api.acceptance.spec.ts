import { test, expect } from '@api/fixtures';
import { getGyms } from '@api/features/gyms/gyms.api';
import {
  API_ROUTES,
  expectResponseBody,
  expectContentType,
  expectStatusCode,
  problemDetailsSchema,
  apiRequest,
} from '@api/support';
import expectedGymsPage1 from '../../testdata/mocks/gyms.page-1.json';

test.describe('Gyms API acceptance', { tag: ['@gyms', '@api'] }, () => {
  test(
    'Given available gyms, when a client requests the first page, then the expected gyms and pagination are returned',
    { tag: ['@smoke', '@acceptance'] },
    async ({ apiClient }) => {
      const response = await getGyms(apiClient, { page: 1, pageSize: 20 });

      expect(response.data).toEqual(expectedGymsPage1.data);
      expect(response.pagination).toMatchObject({
        totalItems: expectedGymsPage1.pagination.totalItems,
        currentPage: expectedGymsPage1.pagination.currentPage,
        pageSize: expectedGymsPage1.pagination.pageSize,
        totalPages: expectedGymsPage1.pagination.totalPages,
        hasNextPage: expectedGymsPage1.pagination.hasNextPage,
        hasPreviousPage: expectedGymsPage1.pagination.hasPreviousPage,
      });
    },
  );

  test(
    'Given read-only mode, when a client attempts to create a gym, then the request is rejected',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const response = await apiRequest(apiClient, 'POST', API_ROUTES.gyms, { data: {} });
      expectStatusCode(response, 405);
      expectContentType(response, 'application/json');
      const problem = await expectResponseBody(response, problemDetailsSchema);
      expect(problem.status).toBe(405);
      expect(problem.title).toBeTruthy();
      expect(problem.type ?? '', 'ProblemDetails.type should be present').toMatch(/rfc7231#section-6\.5\.5/);
    },
  );
});
