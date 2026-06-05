import { test, expect } from '@api/fixtures';
import { API_ROUTES, getTyped, type PaginatedResponse } from '@api/support/api';
import { expectPaginatedResponse } from '../../shared/pagination-contract';

type TemplateDto = Readonly<{
  id: string;
  name: string;
}>;

test.describe('Template API Acceptance', { tag: ['@template', '@api'] }, () => {
  test('GET /api/v1/template returns PaginatedResponse', { tag: ['@smoke', '@acceptance'] }, async ({ apiClient }) => {
    const response = await getTyped<PaginatedResponse<TemplateDto>>(apiClient, API_ROUTES.template, {
      params: { page: 1, pageSize: 25 },
    });

    expectPaginatedResponse(response, { page: 1, pageSize: 25 });
    expect(response.data[0]?.name).toBeTruthy();
  });
});
