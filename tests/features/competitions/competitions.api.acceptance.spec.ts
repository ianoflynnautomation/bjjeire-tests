import { test, expect } from '@api/fixtures';
import { getCompetitions } from '@api/features/competitions/competitions.api';
import { expectedPaginationFor, expectNoOverlapBetweenPages } from '@api/support';
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
      const targetPage = expectedCompetitionsPage2.pagination.currentPage;

      const [page1, page2] = await Promise.all([
        getCompetitions(apiClient, { page: 1, pageSize }),
        getCompetitions(apiClient, { page: targetPage, pageSize }),
      ]);

      expect(page2.data).toEqual(expectedCompetitionsPage2.data);
      expect(page2.pagination).toMatchObject(
        expectedPaginationFor(expectedCompetitionsPage2.pagination.totalItems, pageSize, targetPage),
      );

      expectNoOverlapBetweenPages(page1.data, page2.data, 'competitions');
    },
  );
});
