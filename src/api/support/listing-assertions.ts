import { expect } from '@playwright/test';
import type { PaginatedResponse } from './types';

export function expectListingToInclude<T extends object, K extends keyof T>(
  data: readonly T[],
  key: K,
  expected: readonly (Partial<T> & Pick<T, K>)[],
): void {
  for (const item of expected) {
    const match = data.find(candidate => candidate[key] === item[key]);
    if (match === undefined) {
      throw new Error(`expected listing to include an item with ${String(key)} '${String(item[key])}'`);
    }
    expect<object>(match).toMatchObject(item);
  }
}

export function expectRelativeOrder<T, V>(
  data: readonly T[],
  select: (item: T) => V,
  expectedInOrder: readonly V[],
): void {
  const actualOrder = data.map(select).filter(value => expectedInOrder.includes(value));
  expect(actualOrder).toEqual([...expectedInOrder]);
}

export function expectAllFromCounty(data: readonly Readonly<{ county: string }>[], county: string): void {
  expect(data.length, `expected at least one item from county '${county}'`).toBeGreaterThan(0);
  expect(data.filter(item => item.county !== county)).toEqual([]);
}

function pageParamOf(url: string | null | undefined): string | null {
  return url ? new URL(url, 'http://resolve.invalid').searchParams.get('page') : null;
}

export function expectListingPage<T>(page: PaginatedResponse<T>, currentPage: number, pageSize: number): void {
  const { pagination } = page;
  const expectedItemCount = Math.min(pageSize, pagination.totalItems - (currentPage - 1) * pageSize);

  expect(pagination).toMatchObject({ currentPage, pageSize });
  expect(pagination.totalPages).toBe(Math.ceil(pagination.totalItems / pageSize));
  expect(page.data).toHaveLength(expectedItemCount);

  expect(pagination.hasPreviousPage).toBe(currentPage > 1);
  expect(pagination.hasNextPage).toBe(currentPage < pagination.totalPages);
  expect(pageParamOf(pagination.previousPageUrl)).toBe(currentPage > 1 ? String(currentPage - 1) : null);
  expect(pageParamOf(pagination.nextPageUrl)).toBe(
    currentPage < pagination.totalPages ? String(currentPage + 1) : null,
  );
}

export function expectConsecutivePagePagination<T>(
  firstPage: PaginatedResponse<T>,
  secondPage: PaginatedResponse<T>,
  pageSize: number,
  firstPageNumber = 1,
): void {
  expect(
    firstPage.pagination.totalItems,
    `seeded data must span more than ${firstPageNumber} page(s) of ${pageSize}`,
  ).toBeGreaterThan(firstPageNumber * pageSize);
  expect(secondPage.pagination.totalItems).toBe(firstPage.pagination.totalItems);

  expectListingPage(firstPage, firstPageNumber, pageSize);
  expectListingPage(secondPage, firstPageNumber + 1, pageSize);
}

export function expectPagesAreDistinct<T>(
  firstPage: PaginatedResponse<T>,
  secondPage: PaginatedResponse<T>,
  identityOf: (item: T) => unknown,
): void {
  const firstPageIdentities = new Set(firstPage.data.map(identityOf));
  expect(secondPage.data.filter(item => firstPageIdentities.has(identityOf(item)))).toEqual([]);
}
