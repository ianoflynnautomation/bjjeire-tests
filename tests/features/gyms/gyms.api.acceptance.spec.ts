import { test, expect } from '@api/fixtures';
import { getGyms } from '@api/features/gyms/gyms.api';
import {
  API_ROUTES,
  apiRequest,
  expectAllFromCounty,
  expectConsecutivePagePagination,
  expectListingToInclude,
  expectPagesAreDistinct,
  expectRelativeOrder,
} from '@api/support';
import { SEEDED_GYMS_BY_NAME } from '../../testdata/seeded/gyms';

const FULL_PAGE_SIZE = 100;
const SMALL_PAGE_SIZE = 10;

test.describe('Gyms API acceptance', { tag: ['@gyms', '@api'] }, () => {
  test(
    'Given gyms are published, when a client opens the directory, then each published gym is returned with its details',
    { tag: ['@smoke', '@acceptance'] },
    async ({ apiClient }) => {
      const { data } = await getGyms(apiClient, { page: 1, pageSize: FULL_PAGE_SIZE });

      expectListingToInclude(data, 'name', SEEDED_GYMS_BY_NAME);
    },
  );

  test(
    'Given gyms are published, when a client filters by county, then only gyms from that county are returned',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const county = 'Cork';
      const corkGyms = SEEDED_GYMS_BY_NAME.filter(gym => gym.county === county);

      const { data } = await getGyms(apiClient, { county, page: 1, pageSize: FULL_PAGE_SIZE });

      expectAllFromCounty(data, county);
      expectListingToInclude(data, 'name', corkGyms);
    },
  );

  test(
    'Given gyms are published, when a client opens the directory, then they are ordered by name',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const { data } = await getGyms(apiClient, { page: 1, pageSize: FULL_PAGE_SIZE });

      expectRelativeOrder(
        data,
        gym => gym.name,
        SEEDED_GYMS_BY_NAME.map(gym => gym.name),
      );
    },
  );

  test(
    'Given the directory spans more than one page, when a client pages through it, then each page is a distinct slice with correct links',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const firstPage = await getGyms(apiClient, { page: 1, pageSize: SMALL_PAGE_SIZE });
      const secondPage = await getGyms(apiClient, { page: 2, pageSize: SMALL_PAGE_SIZE });

      expectConsecutivePagePagination(firstPage, secondPage, SMALL_PAGE_SIZE);
      expectPagesAreDistinct(firstPage, secondPage, gym => gym.id);
    },
  );

  test(
    'Given a page beyond the last, when a client requests it, then an empty page with valid pagination is returned',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const beyondLastPage = 999;

      const { data, pagination } = await getGyms(apiClient, { page: beyondLastPage, pageSize: SMALL_PAGE_SIZE });

      expect(data).toEqual([]);
      expect(pagination).toMatchObject({
        currentPage: beyondLastPage,
        pageSize: SMALL_PAGE_SIZE,
        hasNextPage: false,
        hasPreviousPage: true,
      });
      expect(pagination.nextPageUrl).toBeNull();
    },
  );

  test(
    'Given an unknown county, when a client filters by it, then the request is rejected as a bad request',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const response = await apiRequest(apiClient, 'GET', API_ROUTES.gyms, {
        params: { county: 'Atlantis', page: 1, pageSize: FULL_PAGE_SIZE },
      });

      expect(response.status()).toBe(400);
    },
  );
});
