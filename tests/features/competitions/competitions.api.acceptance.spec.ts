import { test, expect } from '@api/fixtures';
import { getCompetitions } from '@api/features/competitions/competitions.api';
import expectedCompetitionsPage1 from '../../testdata/expected/competitions.page-1.json';
import expectedCompetitionsPage2 from '../../testdata/expected/competitions.page-2.json';

test.describe('Competitions API acceptance', { tag: ['@competitions', '@api'] }, () => {
  test(
    'Given competitions are published, when a client opens the competitions listing, then they see the published competitions',
    { tag: ['@smoke', '@acceptance'] },
    async ({ apiClient }) => {
      const response = await getCompetitions(apiClient, {
        page: expectedCompetitionsPage1.pagination.currentPage,
        pageSize: expectedCompetitionsPage1.pagination.pageSize,
      });

      expect(response.data).toEqual(expectedCompetitionsPage1.data);
      expect(response.pagination).toMatchObject({
        totalItems: expectedCompetitionsPage1.pagination.totalItems,
        currentPage: expectedCompetitionsPage1.pagination.currentPage,
        pageSize: expectedCompetitionsPage1.pagination.pageSize,
        totalPages: expectedCompetitionsPage1.pagination.totalPages,
        hasNextPage: expectedCompetitionsPage1.pagination.hasNextPage,
        hasPreviousPage: expectedCompetitionsPage1.pagination.hasPreviousPage,
      });
    },
  );

  test(
    'Given the competitions listing spans more than one page, when a client moves to the next page, then they see a fresh set of competitions with no repeats',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const pageSize = expectedCompetitionsPage2.pagination.pageSize;

      const [page1, page2] = await Promise.all([
        getCompetitions(apiClient, { page: 1, pageSize }),
        getCompetitions(apiClient, { page: expectedCompetitionsPage2.pagination.currentPage, pageSize }),
      ]);

      expect(page2.data).toEqual(expectedCompetitionsPage2.data);
      expect(page2.pagination).toMatchObject({
        totalItems: expectedCompetitionsPage2.pagination.totalItems,
        currentPage: expectedCompetitionsPage2.pagination.currentPage,
        pageSize: expectedCompetitionsPage2.pagination.pageSize,
        totalPages: expectedCompetitionsPage2.pagination.totalPages,
        hasNextPage: expectedCompetitionsPage2.pagination.hasNextPage,
        hasPreviousPage: expectedCompetitionsPage2.pagination.hasPreviousPage,
      });

      const page1Ids = new Set(page1.data.map(c => c.id));
      const repeats = page2.data.filter(c => page1Ids.has(c.id));
      expect(repeats, 'page 2 must not repeat any page-1 competitions').toEqual([]);
    },
  );
});
