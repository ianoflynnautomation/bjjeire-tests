import { test, expect } from '@api/fixtures';
import { getGyms } from '@api/features/gyms/gyms.api';
import { API_ROUTES, apiRequest, expectContentType, expectStatusCode } from '@api/support';
import expectedGymsPage1 from '../../testdata/expected/gyms.page-1.json';
import expectedReadOnlyProblemDetails from '../../testdata/expected/read-only.problem-details.json';

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
      expect(await response.json()).toEqual(expectedReadOnlyProblemDetails);
    },
  );
});
