import { expect } from '@api/fixtures';
import type { PaginatedResponse } from '@api/support';

export function expectPaginatedResponse<T>(
  response: PaginatedResponse<T>,
  options: { pageSize: number; validateItem?: (item: T) => void },
): void {
  const { pagination, data } = response;

  expect(Array.isArray(data)).toBe(true);
  expect(data.length).toBeLessThanOrEqual(options.pageSize);

  expect(pagination.totalPages).toBe(Math.ceil(pagination.totalItems / pagination.pageSize));
  expect(pagination.hasNextPage).toBe(pagination.currentPage < pagination.totalPages);
  expect(pagination.hasPreviousPage).toBe(pagination.currentPage > 1);

  if (options.validateItem) {
    data.forEach(options.validateItem);
  }
}
