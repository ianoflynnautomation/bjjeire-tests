import { expect } from '@shared/fixtures';
import type { PaginatedResponse } from '@api/support/api';

export function expectPaginatedResponse<T>(
  response: PaginatedResponse<T>,
  { page, pageSize }: { page: number; pageSize: number },
): void {
  expect(response.pagination.currentPage).toBe(page);
  expect(response.pagination.pageSize).toBe(pageSize);
  expect(response.data.length).toBeLessThanOrEqual(pageSize);
}
