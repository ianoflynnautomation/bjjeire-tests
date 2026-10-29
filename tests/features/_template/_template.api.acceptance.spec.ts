import { z } from 'zod';
import { test, expect } from '@api/fixtures';
import { API_BASE_PATH, expectSchema, get, paginatedResponseSchema, schemaFor } from '@api/support';
import expectedTemplatePage1 from './_template.page-1.json';
import { squash } from '@squash/annotations';

const TEMPLATE_ROUTE = `${API_BASE_PATH}/template`;

type TemplateDto = Readonly<{
  id: string;
  name: string;
}>;

const templatePageSchema = paginatedResponseSchema(
  schemaFor<TemplateDto>(z.object({ id: z.string(), name: z.string() })),
);

test.describe('Template API acceptance', { tag: ['@template', '@api', '@squash'] }, () => {
  test(
    'client should receive the published items when opening the listing',
    {
      tag: ['@smoke', '@acceptance'],
      annotation: squash({ weight: 'high', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ request }) => {
      const { pagination: expectedPagination, data: expectedData } = expectedTemplatePage1;

      const response = await test.step('When a client requests the first page of the listing', async () => {
        const body = await get(request, TEMPLATE_ROUTE, {
          params: { page: expectedPagination.currentPage, pageSize: expectedPagination.pageSize },
        });
        return expectSchema(templatePageSchema, body);
      });

      await test.step('Then the client receives the published items with their pagination', () => {
        expect(response.data).toEqual(expectedData);
        expect(response.pagination).toMatchObject({
          totalItems: expectedPagination.totalItems,
          currentPage: expectedPagination.currentPage,
          pageSize: expectedPagination.pageSize,
          totalPages: expectedPagination.totalPages,
          hasNextPage: expectedPagination.hasNextPage,
          hasPreviousPage: expectedPagination.hasPreviousPage,
        });
      });
    },
  );
});
