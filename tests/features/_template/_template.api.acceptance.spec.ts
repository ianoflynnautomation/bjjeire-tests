import { test, expect } from '@api/fixtures';
import { API_ROUTES, get, type PaginatedResponse } from '@api/support';
import { expectPaginatedResponse } from '../../shared/pagination-contract';

type TemplateDto = Readonly<{
  id: string;
  name: string;
}>;

test.describe('Template API acceptance', { tag: ['@template', '@api'] }, () => {
  test(
    'Given available feature data, when a client requests the first page, then the data and pagination are returned',
    { tag: ['@smoke', '@acceptance'] },
    async ({ apiClient }) => {
      const response = await get<PaginatedResponse<TemplateDto>>(apiClient, API_ROUTES.template, {
        params: { page: 1, pageSize: 25 },
      });

      expectPaginatedResponse(response, { pageSize: 25 });
      expect(response.data[0]?.name).toBeTruthy();
    },
  );
});
