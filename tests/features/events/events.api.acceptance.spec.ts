import { test, expect } from '@api/fixtures';
import { getBjjEvents, type BjjEventDto } from '@api/features/events/events.api';

const PUBLISHED_EVENTS: readonly Pick<BjjEventDto, 'name' | 'county'>[] = [
  { name: 'Leinster Community Open Mat', county: 'Dublin' },
  { name: 'Rebel County Submission Seminar', county: 'Cork' },
  { name: 'Tribes No-Gi Camp Galway', county: 'Galway' },
];

const FINISHED_EVENT = 'Winter Solstice Open Mat';
const FULL_PAGE_SIZE = 50;

test.describe('Events API acceptance', { tag: ['@bjj-events', '@events', '@api'] }, () => {
  test(
    'Given events are published, when a client opens the listing, then each upcoming event is returned with its details',
    { tag: ['@smoke', '@acceptance'] },
    async ({ apiClient }) => {
      const { data } = await getBjjEvents(apiClient, { page: 1, pageSize: FULL_PAGE_SIZE });

      for (const fixture of PUBLISHED_EVENTS) {
        const event = data.find(item => item.name === fixture.name);
        expect(event).toBeDefined();
        expect(event).toMatchObject({ name: fixture.name, county: fixture.county });
      }
    },
  );

  test(
    'Given an event has finished, when a client opens the listing, then it is not shown',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const { data } = await getBjjEvents(apiClient, { page: 1, pageSize: FULL_PAGE_SIZE });
      const names = data.map(event => event.name);

      expect(names).not.toContain(FINISHED_EVENT);
    },
  );

  test(
    'Given events are published, when a client filters by county, then only upcoming events from that county are returned',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const county = 'Dublin';
      const { data } = await getBjjEvents(apiClient, { county, page: 1, pageSize: FULL_PAGE_SIZE });

      expect(data.length).toBeGreaterThan(0);
      expect(data.filter(event => event.county !== county)).toEqual([]);

      const names = data.map(event => event.name);
      expect(names).toContain('Leinster Community Open Mat');
      expect(names).not.toContain(FINISHED_EVENT);
    },
  );

  test(
    'Given the listing spans more than one page, when a client pages through it, then each page is a distinct slice with correct links',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const pageSize = 2;

      const page1 = await getBjjEvents(apiClient, { page: 1, pageSize });
      expect(page1.data).toHaveLength(pageSize);
      expect(page1.pagination.totalItems).toBeGreaterThanOrEqual(PUBLISHED_EVENTS.length);
      expect(page1.pagination.currentPage).toBe(1);
      expect(page1.pagination.pageSize).toBe(pageSize);
      expect(page1.pagination.hasPreviousPage).toBe(false);
      expect(page1.pagination.previousPageUrl).toBeNull();
      expect(page1.pagination.hasNextPage).toBe(true);
      expect(page1.pagination.nextPageUrl).toContain('page=2');

      const page2 = await getBjjEvents(apiClient, { page: 2, pageSize });
      expect(page2.data.length).toBeGreaterThan(0);
      expect(page2.pagination.currentPage).toBe(2);
      expect(page2.pagination.hasPreviousPage).toBe(true);
      expect(page2.pagination.previousPageUrl).toContain('page=1');

      const page1Ids = page1.data.map(event => event.id);
      expect(page2.data.filter(event => page1Ids.includes(event.id))).toEqual([]);
    },
  );
});
