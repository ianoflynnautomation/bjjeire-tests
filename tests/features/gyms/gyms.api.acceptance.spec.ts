import { test, expect } from '@api/fixtures';
import { getGyms, type GymDto } from '@api/features/gyms/gyms.api';

const GYM_FIXTURES: readonly Pick<GymDto, 'name' | 'county'>[] = [
  { name: 'Blackwater Valley BJJ', county: 'Cork' },
  { name: 'Harbour City Jiu-Jitsu', county: 'Cork' },
  { name: 'Liffey Grappling Club', county: 'Dublin' },
  { name: 'Northside Mat Room', county: 'Dublin' },
];

const GYM_NAMES_IN_ORDER: readonly string[] = GYM_FIXTURES.map(gym => gym.name);
const CORK = 'Cork';
const FULL_PAGE_SIZE = 100;

test.describe('Gyms API acceptance', { tag: ['@gyms', '@api'] }, () => {
  test(
    'Given gyms are published, when a client opens the directory, then each published gym is returned with its details',
    { tag: ['@smoke', '@acceptance'] },
    async ({ apiClient }) => {
      const { data } = await getGyms(apiClient, { page: 1, pageSize: FULL_PAGE_SIZE });

      for (const fixture of GYM_FIXTURES) {
        const gym = data.find(item => item.name === fixture.name);
        expect(gym).toBeDefined();
        expect(gym).toMatchObject({ name: fixture.name, county: fixture.county, status: 'Active' });
      }
    },
  );

  test(
    'Given gyms are published, when a client filters by county, then only gyms from that county are returned',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const { data } = await getGyms(apiClient, { county: CORK, page: 1, pageSize: FULL_PAGE_SIZE });

      expect(data.length).toBeGreaterThan(0);
      expect(data.filter(gym => gym.county !== CORK)).toEqual([]);

      const names = data.map(gym => gym.name);
      expect(names).toContain('Blackwater Valley BJJ');
      expect(names).toContain('Harbour City Jiu-Jitsu');
    },
  );

  test(
    'Given gyms are published, when a client opens the directory, then they are ordered by name',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const { data } = await getGyms(apiClient, { page: 1, pageSize: FULL_PAGE_SIZE });

      const seededInResponseOrder = data.map(gym => gym.name).filter(name => GYM_NAMES_IN_ORDER.includes(name));
      expect(seededInResponseOrder).toEqual(GYM_NAMES_IN_ORDER);
    },
  );

  test(
    'Given the directory spans more than one page, when a client pages through it, then each page is a distinct slice with correct links',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const pageSize = 10;

      const page1 = await getGyms(apiClient, { page: 1, pageSize });
      expect(page1.data).toHaveLength(pageSize);
      expect(page1.pagination.currentPage).toBe(1);
      expect(page1.pagination.pageSize).toBe(pageSize);
      expect(page1.pagination.totalItems).toBeGreaterThan(pageSize);
      expect(page1.pagination.hasPreviousPage).toBe(false);
      expect(page1.pagination.previousPageUrl).toBeNull();
      expect(page1.pagination.hasNextPage).toBe(true);
      expect(page1.pagination.nextPageUrl).toContain('page=2');

      const page2 = await getGyms(apiClient, { page: 2, pageSize });
      expect(page2.data.length).toBeGreaterThan(0);
      expect(page2.pagination.currentPage).toBe(2);
      expect(page2.pagination.hasPreviousPage).toBe(true);
      expect(page2.pagination.previousPageUrl).toContain('page=1');

      const page1Ids = page1.data.map(gym => gym.id);
      expect(page2.data.filter(gym => page1Ids.includes(gym.id))).toEqual([]);
    },
  );
});
