import { test, expect } from '@api/fixtures';
import { getBjjEvents } from '@api/features/events/events.api';
import expectedEventsPage1 from '../../testdata/expected/events.page-1.json';
import { API_ROUTES, apiRequest, expectContentType, expectStatusCode } from '@api/support';
import expectedReadOnlyProblemDetails from '../../testdata/expected/read-only.problem-details.json';

test.describe('Events API acceptance', { tag: ['@bjj-events', '@events', '@api'] }, () => {
  test(
    'Given available events, when a client requests the first page, then the expected events and pagination are returned',
    { tag: ['@smoke', '@acceptance'] },
    async ({ apiClient }) => {
      const response = await getBjjEvents(apiClient, {
        page: expectedEventsPage1.pagination.currentPage,
        pageSize: expectedEventsPage1.pagination.pageSize,
      });

      expect(response.data).toEqual(expectedEventsPage1.data);
      expect(response.pagination).toMatchObject({
        totalItems: expectedEventsPage1.pagination.totalItems,
        currentPage: expectedEventsPage1.pagination.currentPage,
        pageSize: expectedEventsPage1.pagination.pageSize,
        totalPages: expectedEventsPage1.pagination.totalPages,
        hasNextPage: expectedEventsPage1.pagination.hasNextPage,
        hasPreviousPage: expectedEventsPage1.pagination.hasPreviousPage,
      });
    },
  );

  test(
    'Given read-only mode, when a client attempts to create a event, then the request is rejected',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const response = await apiRequest(apiClient, 'POST', API_ROUTES.bjjEvents, { data: {} });
      expectStatusCode(response, 405);
      expectContentType(response, 'application/json');
      expect(await response.json()).toEqual(expectedReadOnlyProblemDetails);
    },
  );
});
