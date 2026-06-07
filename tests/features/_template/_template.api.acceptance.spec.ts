import { test, expect } from '@api/fixtures';
import { API_ROUTES, get, type PaginatedResponse } from '@api/support';
import expectedTemplatePage1 from '../../testdata/expected/_template.page-1.json';

type TemplateDto = Readonly<{
  id: string;
  name: string;
}>;

test.describe('Template API acceptance', { tag: ['@template', '@api'] }, () => {
  test(
    'Given the feature catalogue is published, when a client opens the listing, then they see the published items',
    { tag: ['@smoke', '@acceptance'] },
    async ({ apiClient }) => {
      const response = await get<PaginatedResponse<TemplateDto>>(apiClient, API_ROUTES.template, {
        params: {
          page: expectedTemplatePage1.pagination.currentPage,
          pageSize: expectedTemplatePage1.pagination.pageSize,
        },
      });

      expect(response.data).toEqual(expectedTemplatePage1.data);
      expect(response.pagination).toMatchObject({
        totalItems: expectedTemplatePage1.pagination.totalItems,
        currentPage: expectedTemplatePage1.pagination.currentPage,
        pageSize: expectedTemplatePage1.pagination.pageSize,
        totalPages: expectedTemplatePage1.pagination.totalPages,
        hasNextPage: expectedTemplatePage1.pagination.hasNextPage,
        hasPreviousPage: expectedTemplatePage1.pagination.hasPreviousPage,
      });
    },
  );
});
