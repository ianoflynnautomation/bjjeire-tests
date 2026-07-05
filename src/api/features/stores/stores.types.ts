import type { BaseApiEntityModel, PaginationQuery } from '@api/support';
import type { StoreId } from '@shared/types';

export type StoreDto = BaseApiEntityModel<StoreId> &
  Readonly<{
    name: string;
    description?: string | null;
    websiteUrl: string;
    logoUrl?: string | null;
    isActive: boolean;
  }>;

export type GetStorePaginationQuery = PaginationQuery;
