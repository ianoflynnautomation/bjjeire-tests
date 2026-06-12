import { test, expect } from '@api/fixtures';
import { getGyms } from '@api/features/gyms/gyms.api';
import expectedGymsPage1 from '../../testdata/expected/gyms.page-1.json';

test.describe('Gyms API acceptance', { tag: ['@gyms', '@api'] }, () => {
  test(
    'Given gyms are published, when a client requests the gym page, then they see the published gyms',
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
    'Given gyms are published, when a client requests gyms from a county, then they should only see published gyms from that county',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const county = 'Cork';
      const response = await getGyms(apiClient, { county, page: 1, pageSize: 20 });

      expect(response.data, `expected at least one published gym in ${county}`).not.toHaveLength(0);

      const offenders = response.data.filter(gym => gym.county !== county);
      expect(offenders, `every returned gym must have county="${county}"`).toEqual([]);
    },
  );

  test(
    'Given gyms are filtered by county, when the client paginates the filtered list, then pagination reflects the filtered set',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const county = 'Cork';
      const pageSize = 5;

      const [filtered, unfiltered] = await Promise.all([
        getGyms(apiClient, { county, page: 1, pageSize }),
        getGyms(apiClient, { page: 1, pageSize }),
      ]);

      expect(filtered.data.length).toBeLessThanOrEqual(pageSize);

      const offenders = filtered.data.filter(gym => gym.county !== county);
      expect(offenders, 'paginated page must keep the filter applied').toEqual([]);

      expect(filtered.pagination.totalItems).toBeLessThanOrEqual(unfiltered.pagination.totalItems);
      expect(filtered.pagination.totalPages).toBe(Math.ceil(filtered.pagination.totalItems / pageSize));
    },
  );

  test(
    'Given the gym directory spans more than one page, when a client moves to the next page, then they see a fresh set of gyms with no repeats',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const pageSize = 10;

      const [page1, page2] = await Promise.all([
        getGyms(apiClient, { page: 1, pageSize }),
        getGyms(apiClient, { page: 2, pageSize }),
      ]);

      expect(page2.data).toEqual(expectedGymsPage1.data.slice(pageSize, pageSize * 2));
      expect(page2.pagination).toMatchObject({
        totalItems: expectedGymsPage1.pagination.totalItems,
        currentPage: 2,
        pageSize,
        totalPages: Math.ceil(expectedGymsPage1.pagination.totalItems / pageSize),
        hasNextPage: true,
        hasPreviousPage: true,
      });

      const page1Ids = new Set(page1.data.map(gym => gym.id));
      const repeats = page2.data.filter(gym => page1Ids.has(gym.id));
      expect(repeats, 'page 2 must not repeat any page-1 gyms').toEqual([]);
    },
  );

  test(
    'Given a client reaches the final page, when they request it, then no further pages are advertised',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const pageSize = 5;
      const totalItems = expectedGymsPage1.pagination.totalItems;
      const lastPage = Math.ceil(totalItems / pageSize);

      expect(lastPage, 'test data must span more than one page').toBeGreaterThan(1);

      const response = await getGyms(apiClient, { page: lastPage, pageSize });

      const expectedLastPageSize = totalItems - (lastPage - 1) * pageSize;
      expect(response.data).toHaveLength(expectedLastPageSize);
      expect(response.pagination).toMatchObject({
        currentPage: lastPage,
        totalPages: lastPage,
        hasNextPage: false,
        hasPreviousPage: true,
      });
    },
  );
});
