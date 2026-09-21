import { z } from 'zod';
import { test, expect } from '@api/fixtures';
import { API_BASE_PATH, get, paginatedResponseSchema, schemaFor } from '@api/support';
import expectedTemplatePage1 from './_template.page-1.json';

const TEMPLATE_ROUTE = `${API_BASE_PATH}/template`;

type TemplateDto = Readonly<{
  id: string;
  name: string;
}>;

// Every response is validated against the feature's wire schema, so a drifted
// contract fails at the parse step with a field-level message instead of
// surfacing as a confusing assertion diff.
const templatePageSchema = paginatedResponseSchema(
  schemaFor<TemplateDto>(z.object({ id: z.string(), name: z.string() })),
);

test.describe('Template API acceptance', { tag: ['@template', '@api'] }, () => {
  test(
    'Given the feature catalogue is published, when a client opens the listing, then they see the published items',
    { tag: ['@smoke', '@acceptance'] },
    async ({ request }) => {
      const { pagination: expectedPagination, data: expectedData } = expectedTemplatePage1;

      const response = await get(request, TEMPLATE_ROUTE, {
        params: { page: expectedPagination.currentPage, pageSize: expectedPagination.pageSize },
        schema: templatePageSchema,
      });

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
