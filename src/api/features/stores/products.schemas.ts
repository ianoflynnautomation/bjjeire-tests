import { openApiSchema, openApiPageSchema } from '@api/support';
import { zPagedResponseProductSummaryDto, zProductDto } from '@api/generated/zod.gen';
import type { ProductDto, ProductSummaryDto } from './products.types';

export const productsPageSchema = openApiPageSchema<ProductSummaryDto>(zPagedResponseProductSummaryDto);
export const productSchema = openApiSchema<ProductDto>(zProductDto);
