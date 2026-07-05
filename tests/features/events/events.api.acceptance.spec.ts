import { test, expect } from '@api/fixtures';
import { BjjEventType, getBjjEvents } from '@api/features/events/events.api';
import {
  expectAllFromCounty,
  expectConsecutivePagePagination,
  expectListingToInclude,
  expectPagesAreDistinct,
  expectRelativeOrder,
} from '@api/support';
import { SEEDED_EVENT_FINISHED_WINTER_SOLSTICE, SEEDED_UPCOMING_EVENTS } from '../../testdata/seeded/events';

const FULL_PAGE_SIZE = 50;
const SMALL_PAGE_SIZE = 2;

test.describe('Events API acceptance', { tag: ['@bjj-events', '@events', '@api'] }, () => {
  test(
    'Given events are published, when a client opens the listing, then each upcoming event is returned with its details',
    { tag: ['@smoke', '@acceptance'] },
    async ({ apiClient }) => {
      const { data } = await getBjjEvents(apiClient, { page: 1, pageSize: FULL_PAGE_SIZE });

      expectListingToInclude(data, 'name', SEEDED_UPCOMING_EVENTS);
    },
  );

  test(
    'Given an event has finished, when a client opens the listing, then it is not shown',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const { data } = await getBjjEvents(apiClient, { page: 1, pageSize: FULL_PAGE_SIZE });

      expect(data.map(event => event.name)).not.toContain(SEEDED_EVENT_FINISHED_WINTER_SOLSTICE.name);
    },
  );

  test(
    'Given events are published, when a client filters by county, then only upcoming events from that county are returned',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const county = 'Dublin';
      const dublinEvents = SEEDED_UPCOMING_EVENTS.filter(event => event.county === county);

      const { data } = await getBjjEvents(apiClient, { county, page: 1, pageSize: FULL_PAGE_SIZE });

      expectAllFromCounty(data, county);
      expectListingToInclude(data, 'name', dublinEvents);
      expect(data.map(event => event.name)).not.toContain(SEEDED_EVENT_FINISHED_WINTER_SOLSTICE.name);
    },
  );

  test(
    'Given several events are published, when a client opens the listing, then they are ordered by creation date',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const { data } = await getBjjEvents(apiClient, { page: 1, pageSize: FULL_PAGE_SIZE });

      expectRelativeOrder(
        data,
        event => event.name,
        SEEDED_UPCOMING_EVENTS.map(event => event.name),
      );
    },
  );

  test(
    'Given events are published, when a client filters by type, then only upcoming events of that type are returned',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const type = BjjEventType.Seminar;
      const seminarEvents = SEEDED_UPCOMING_EVENTS.filter(event => event.type === type);

      const { data } = await getBjjEvents(apiClient, { type, page: 1, pageSize: FULL_PAGE_SIZE });

      expect(data.filter(event => event.type !== type)).toEqual([]);
      expectListingToInclude(data, 'name', seminarEvents);
    },
  );

  test(
    'Given the listing spans more than one page, when a client pages through it, then each page is a distinct slice with correct links',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const firstPage = await getBjjEvents(apiClient, { page: 1, pageSize: SMALL_PAGE_SIZE });
      const secondPage = await getBjjEvents(apiClient, { page: 2, pageSize: SMALL_PAGE_SIZE });

      expectConsecutivePagePagination(firstPage, secondPage, SMALL_PAGE_SIZE);
      expectPagesAreDistinct(firstPage, secondPage, event => event.id);
    },
  );
});
