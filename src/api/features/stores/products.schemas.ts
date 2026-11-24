import { z, type ZodType } from 'zod';
import { openApiSchema, openApiPageSchema } from '@api/support';
import { zPagedResponseProductSummaryDto, zProductDto } from '@api/generated/zod.gen';
import type { ProductDto, ProductSummaryDto, ShopDeliveryDto } from './products.types';

export const productsPageSchema = openApiPageSchema<ProductSummaryDto>(zPagedResponseProductSummaryDto);
export const productSchema = openApiSchema<ProductDto>(zProductDto);

// `/order/delivery` is not in the published OpenAPI contract, so there is no generated schema to reuse.
export const shopDeliverySchema: ZodType<ShopDeliveryDto> = z.object({
  deliveryFeeCents: z.number().int(),
  currency: z.string(),
  countries: z.array(z.string()),
});
