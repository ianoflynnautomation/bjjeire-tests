import { test } from '@api/fixtures';
import { getStores } from '@api/features/stores/stores.api';
import {
  expectConsecutivePagePagination,
  expectListingToInclude,
  expectPagesAreDistinct,
  expectRelativeOrder,
} from '@api/support';
import { SEEDED_STORES_BY_NAME } from '../../testdata/seeded/stores';

const FULL_PAGE_SIZE = 100;
const SMALL_PAGE_SIZE = 2;

test.describe('Stores API acceptance', { tag: ['@stores', '@api'] }, () => {
  test(
    'Given stores are published, when a client opens the directory, then each published store is returned with its details',
    { tag: ['@smoke', '@acceptance'] },
    async ({ apiClient }) => {
      const { data } = await getStores(apiClient, { page: 1, pageSize: FULL_PAGE_SIZE });

      expectListingToInclude(data, 'name', SEEDED_STORES_BY_NAME);
    },
  );

  test(
    'Given stores are published, when a client opens the directory, then they are ordered by name',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const { data } = await getStores(apiClient, { page: 1, pageSize: FULL_PAGE_SIZE });

      expectRelativeOrder(
        data,
        store => store.name,
        SEEDED_STORES_BY_NAME.map(store => store.name),
      );
    },
  );

  test(
    'Given the directory spans more than one page, when a client pages through it, then each page is a distinct slice with correct links',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const firstPage = await getStores(apiClient, { page: 1, pageSize: SMALL_PAGE_SIZE });
      const secondPage = await getStores(apiClient, { page: 2, pageSize: SMALL_PAGE_SIZE });

      expectConsecutivePagePagination(firstPage, secondPage, SMALL_PAGE_SIZE);
      expectPagesAreDistinct(firstPage, secondPage, store => store.id);
    },
  );
});
