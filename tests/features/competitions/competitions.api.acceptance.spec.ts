import { test, expect } from '@api/fixtures';
import { getCompetitions } from '@api/features/competitions/competitions.api';
import {
  expectConsecutivePagePagination,
  expectListingToInclude,
  expectPagesAreDistinct,
  expectRelativeOrder,
} from '@api/support';
import {
  SEEDED_COMPETITION_FINISHED_KERRY_COAST,
  SEEDED_COMPETITIONS_BY_START_DATE,
} from '../../testdata/seeded/competitions';

const FULL_PAGE_SIZE = 50;
const SMALL_PAGE_SIZE = 2;

test.describe('Competitions API acceptance', { tag: ['@competitions', '@api'] }, () => {
  test(
    'Given competitions are published, when a client opens the listing, then each published competition is returned with its details',
    { tag: ['@smoke', '@acceptance'] },
    async ({ apiClient }) => {
      const { data } = await getCompetitions(apiClient, { page: 1, pageSize: FULL_PAGE_SIZE });

      expectListingToInclude(data, 'slug', SEEDED_COMPETITIONS_BY_START_DATE);
    },
  );

  test(
    'Given a competition has finished, when a client opens the listing, then it is not shown',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const { data } = await getCompetitions(apiClient, { page: 1, pageSize: FULL_PAGE_SIZE });

      expect(data.map(competition => competition.slug)).not.toContain(SEEDED_COMPETITION_FINISHED_KERRY_COAST.slug);
    },
  );

  test(
    'Given several competitions are published, when a client opens the listing, then they are ordered by start date',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const { data } = await getCompetitions(apiClient, { page: 1, pageSize: FULL_PAGE_SIZE });

      expectRelativeOrder(
        data,
        competition => competition.slug,
        SEEDED_COMPETITIONS_BY_START_DATE.map(competition => competition.slug),
      );
    },
  );

  test(
    'Given the listing spans more than one page, when a client pages through it, then each page is a distinct slice with correct links',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const firstPage = await getCompetitions(apiClient, { page: 1, pageSize: SMALL_PAGE_SIZE });
      const secondPage = await getCompetitions(apiClient, { page: 2, pageSize: SMALL_PAGE_SIZE });

      expectConsecutivePagePagination(firstPage, secondPage, SMALL_PAGE_SIZE);
      expectPagesAreDistinct(firstPage, secondPage, competition => competition.slug);
    },
  );
});
