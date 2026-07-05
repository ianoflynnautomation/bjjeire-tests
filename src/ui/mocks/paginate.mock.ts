import type { PaginatedResponse } from '@api/support';

export function paginatePages<T>(
  items: readonly T[],
  pageSize: number,
  basePath: string,
): Readonly<Record<number, PaginatedResponse<T>>> {
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const pageUrl = (pageNumber: number): string => `${basePath}?page=${pageNumber}&pageSize=${pageSize}`;

  const pages: Record<number, PaginatedResponse<T>> = {};
  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
    pages[pageNumber] = {
      data: items.slice((pageNumber - 1) * pageSize, pageNumber * pageSize),
      pagination: {
        totalItems,
        currentPage: pageNumber,
        pageSize,
        totalPages,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1,
        nextPageUrl: pageNumber < totalPages ? pageUrl(pageNumber + 1) : null,
        previousPageUrl: pageNumber > 1 ? pageUrl(pageNumber - 1) : null,
      },
    };
  }
  return pages;
}
