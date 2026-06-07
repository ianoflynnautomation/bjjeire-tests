import { test, expect } from '@api/fixtures';
import { getBjjEvents } from '@api/features/events/events.api';
import expectedEventsPage1 from '../../testdata/mocks/events.page-1.json';

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
});
