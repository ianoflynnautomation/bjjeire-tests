import type { APIRequestContext } from '@playwright/test';
import type { ZodType } from 'zod';
import {
  API_ROUTES,
  resourcePath,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  expectSchema,
  get,
  type PaginatedResponse,
} from '@api/support';
import type { GetProductsQuery, ProductDto, ProductSummaryDto } from './products.types';

export async function getProducts(
  request: APIRequestContext,
  schema: ZodType<PaginatedResponse<ProductSummaryDto>>,
  { page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE }: GetProductsQuery = {},
): Promise<PaginatedResponse<ProductSummaryDto>> {
  const body = await get(request, API_ROUTES.products, { params: { page, pageSize } });
  return expectSchema(schema, body);
}

export async function getProductBySlug(
  request: APIRequestContext,
  schema: ZodType<ProductDto>,
  slug: string,
): Promise<ProductDto> {
  return expectSchema(schema, await get(request, resourcePath(API_ROUTES.products, slug)));
}
