import type { PaginationQuery } from '@api/support';

export type ProductKind = 'RASHGUARD' | 'SHORTS' | 'T_SHIRT';

export type ProductSummaryDto = Readonly<{
  id?: string;
  slug: string;
  name: string;
  kind: ProductKind;
  priceCents: number;
  currency: string;
  photo?: string;
  soldOut: boolean;
}>;

export type GetProductsQuery = PaginationQuery;

export type ProductSizeDto = Readonly<{ id: string; available: number; soldOut: boolean }>;

export type ProductDto = Readonly<{
  id: string;
  slug: string;
  name: string;
  kind: ProductKind;
  description: string;
  priceCents: number;
  currency: string;
  photos?: readonly string[];
  sizes: readonly ProductSizeDto[];
  soldOut: boolean;
}>;

/** `GET /order/delivery`. The path is not in the published contract, so this mirrors the app's `ShopDeliveryDto`. */
export type ShopDeliveryDto = Readonly<{ deliveryFeeCents: number; currency: string; countries: string[] }>;
