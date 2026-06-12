import { test, expect } from '@api/fixtures';
import { getBjjEvents } from '@api/features/events/events.api';
import expectedEventsPage1 from '../../testdata/expected/events.page-1.json';

test.describe('Events API acceptance', { tag: ['@bjj-events', '@events', '@api'] }, () => {
  test(
    'Given upcoming events are published, when a client opens the events listing, then they see the published events',
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
    'Given events are published, when a client requests events from a county, then they should only see published events from that county',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const county = 'Dublin';
      const response = await getBjjEvents(apiClient, { county, page: 1, pageSize: 20 });

      expect(response.data, `expected at least one published event in ${county}`).not.toHaveLength(0);

      const offenders = response.data.filter(event => event.county !== county);
      expect(offenders, `every returned event must have county="${county}"`).toEqual([]);
    },
  );

  test(
    'Given events span every county, when a client browses without a county filter, then events from every county are returned',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const response = await getBjjEvents(apiClient, {
        county: 'all',
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
