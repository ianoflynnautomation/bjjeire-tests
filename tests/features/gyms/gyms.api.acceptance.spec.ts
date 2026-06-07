import { test, expect } from '@api/fixtures';
import { getGyms } from '@api/features/gyms/gyms.api';
import { API_ROUTES, apiRequest, expectContentType, expectStatusCode } from '@api/support';
import expectedGymsPage1 from '../../testdata/expected/gyms.page-1.json';
import expectedReadOnlyProblemDetails from '../../testdata/expected/read-only.problem-details.json';

test.describe('Gyms API acceptance', { tag: ['@gyms', '@api'] }, () => {
  test(
    'Given gyms are published, when a client opens the gym directory, then they see the published gyms',
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
    'Given the gym directory is read-only, when a client attempts to register a new gym, then their request is refused',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const response = await apiRequest(apiClient, 'POST', API_ROUTES.gyms, { data: {} });
      expectStatusCode(response, 405);
      expectContentType(response, 'application/json');
      expect(await response.json()).toEqual(expectedReadOnlyProblemDetails);
    },
  );

  test(
    'Given the gym directory spans more than one page, when a client moves to the next page, then they see a fresh set of gyms with no repeats',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const pageSize = 10;
      const response = await getGyms(apiClient, { page: 2, pageSize });

      expect(response.data).toEqual(expectedGymsPage1.data.slice(pageSize, pageSize * 2));
      expect(response.pagination).toMatchObject({
        totalItems: expectedGymsPage1.pagination.totalItems,
        currentPage: 2,
        pageSize,
        totalPages: Math.ceil(expectedGymsPage1.pagination.totalItems / pageSize),
        hasNextPage: true,
        hasPreviousPage: true,
      });

      const page1Response = await getGyms(apiClient, { page: 1, pageSize });
      const page1Ids = new Set(page1Response.data.map(gym => gym.id));
      const overlap = response.data.filter(gym => gym.id !== undefined && page1Ids.has(gym.id));
      expect(overlap, 'page 2 must not contain any page-1 ids').toEqual([]);
    },
  );
});
