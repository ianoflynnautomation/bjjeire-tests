import { z } from 'zod';
import { test, expect } from '@api/fixtures';
import { API_BASE_PATH, expectSchema, get, paginatedResponseSchema, schemaFor } from '@api/support';
import expectedTemplatePage1 from './_template.page-1.json';

const TEMPLATE_ROUTE = `${API_BASE_PATH}/template`;

type TemplateDto = Readonly<{
  id: string;
  name: string;
}>;

const templatePageSchema = paginatedResponseSchema(
  schemaFor<TemplateDto>(z.object({ id: z.string(), name: z.string() })),
);

test.describe('Template API acceptance', { tag: ['@template', '@api'] }, () => {
  test(
    'Given the feature catalogue is published, when a client opens the listing, then they see the published items',
    { tag: ['@smoke', '@acceptance'] },
    async ({ request }) => {
      const { pagination: expectedPagination, data: expectedData } = expectedTemplatePage1;

      const body = await get(request, TEMPLATE_ROUTE, {
        params: { page: expectedPagination.currentPage, pageSize: expectedPagination.pageSize },
      });
      const response = expectSchema(templatePageSchema, body);

      expect(response.data).toEqual(expectedData);
      expect(response.pagination).toMatchObject({
        totalItems: expectedPagination.totalItems,
        currentPage: expectedPagination.currentPage,
        pageSize: expectedPagination.pageSize,
        totalPages: expectedPagination.totalPages,
        hasNextPage: expectedPagination.hasNextPage,
        hasPreviousPage: expectedPagination.hasPreviousPage,
      });
    },
  );
});
