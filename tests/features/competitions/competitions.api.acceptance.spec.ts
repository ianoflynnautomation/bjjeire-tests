import { test, expect } from '@api/fixtures';
import { getCompetitions } from '@api/features/competitions/competitions.api';
import {
  API_ROUTES,
  apiRequest,
  expectContentType,
  expectResponseBody,
  expectStatusCode,
  problemDetailsSchema,
} from '@api/support';
import expectedCompetitionsPage1 from '../../testdata/mocks/competitions.page-1.json';
import expectedCompetitionsPage2 from '../../testdata/mocks/competitions.page-2.json';

test.describe('Competitions API acceptance', { tag: ['@competitions', '@api'] }, () => {
  test(
    'Given available competitions, when a client requests the first page, then the expected competitions and pagination are returned',
    { tag: ['@smoke', '@acceptance'] },
    async ({ apiClient }) => {
      const response = await getCompetitions(apiClient, {
        page: expectedCompetitionsPage1.pagination.currentPage,
        pageSize: expectedCompetitionsPage1.pagination.pageSize,
      });

      expect(response.data).toEqual(expectedCompetitionsPage1.data);
      expect(response.pagination).toMatchObject({
        totalItems: expectedCompetitionsPage1.pagination.totalItems,
        currentPage: expectedCompetitionsPage1.pagination.currentPage,
        pageSize: expectedCompetitionsPage1.pagination.pageSize,
        totalPages: expectedCompetitionsPage1.pagination.totalPages,
        hasNextPage: expectedCompetitionsPage1.pagination.hasNextPage,
        hasPreviousPage: expectedCompetitionsPage1.pagination.hasPreviousPage,
      });
    },
  );

  test(
    'Given multiple competition pages, when a client requests page two, then a distinct next page is returned',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const response = await getCompetitions(apiClient, {
        page: expectedCompetitionsPage2.pagination.currentPage,
        pageSize: expectedCompetitionsPage2.pagination.pageSize,
      });

      expect(response.data).toEqual(expectedCompetitionsPage2.data);
      expect(response.pagination).toMatchObject({
        currentPage: 2,
        hasPreviousPage: true,
      });

      const page1Response = await getCompetitions(apiClient, {
        page: 1,
        pageSize: expectedCompetitionsPage2.pagination.pageSize,
      });
      const page1Ids = new Set(page1Response.data.map(c => c.id));
      const overlap = response.data.filter(c => c.id !== undefined && page1Ids.has(c.id));
      expect(overlap, 'page 2 must not contain any page-1 ids').toEqual([]);
    },
  );

  test(
    'Given read-only mode, when a client attempts to create a competition, then the request is rejected',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const response = await apiRequest(apiClient, 'POST', API_ROUTES.competitions, { data: {} });
      expectStatusCode(response, 405);
      expectContentType(response, 'application/json');
      const problem = await expectResponseBody(response, problemDetailsSchema);
      expect(problem.status).toBe(405);
      expect(problem.title).toBeTruthy();
      expect(problem.type ?? '', 'ProblemDetails.type should be present').toMatch(/rfc7231#section-6\.5\.5/);
    },
  );
});
