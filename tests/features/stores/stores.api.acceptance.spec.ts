import { test, expect } from '@api/fixtures';
import { getStores, type StoreDto } from '@api/features/stores/stores.api';

const STORE_NAMES_IN_ORDER: readonly StoreDto['name'][] = [
  'Aran Fight Gear',
  'Celtic Grappling Supply',
  'Emerald Kimonos',
];
const FULL_PAGE_SIZE = 100;

test.describe('Stores API acceptance', { tag: ['@stores', '@api'] }, () => {
  test(
    'Given stores are published, when a client opens the directory, then each published store is returned with its details',
    { tag: ['@smoke', '@acceptance'] },
    async ({ apiClient }) => {
      const { data } = await getStores(apiClient, { page: 1, pageSize: FULL_PAGE_SIZE });

      for (const name of STORE_NAMES_IN_ORDER) {
        const store = data.find(item => item.name === name);
        expect(store).toBeDefined();
        expect(store).toMatchObject({ name, isActive: true });
      }
    },
  );

  test(
    'Given stores are published, when a client opens the directory, then they are ordered by name',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const { data } = await getStores(apiClient, { page: 1, pageSize: FULL_PAGE_SIZE });

      const seededInResponseOrder = data.map(store => store.name).filter(name => STORE_NAMES_IN_ORDER.includes(name));
      expect(seededInResponseOrder).toEqual(STORE_NAMES_IN_ORDER);
    },
  );

  test(
    'Given the directory spans more than one page, when a client pages through it, then each page is a distinct slice with correct links',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const pageSize = 2;

      const page1 = await getStores(apiClient, { page: 1, pageSize });
      expect(page1.data).toHaveLength(pageSize);
      expect(page1.pagination.totalItems).toBeGreaterThan(pageSize);
      expect(page1.pagination.currentPage).toBe(1);
      expect(page1.pagination.pageSize).toBe(pageSize);
      expect(page1.pagination.hasPreviousPage).toBe(false);
      expect(page1.pagination.previousPageUrl).toBeNull();
      expect(page1.pagination.hasNextPage).toBe(true);
      expect(page1.pagination.nextPageUrl).toContain('page=2');

      const page2 = await getStores(apiClient, { page: 2, pageSize });
      expect(page2.data.length).toBeGreaterThan(0);
      expect(page2.pagination.currentPage).toBe(2);
      expect(page2.pagination.hasPreviousPage).toBe(true);
      expect(page2.pagination.previousPageUrl).toContain('page=1');

      const page1Ids = page1.data.map(store => store.id);
      expect(page2.data.filter(store => page1Ids.includes(store.id))).toEqual([]);
    },
  );
});
