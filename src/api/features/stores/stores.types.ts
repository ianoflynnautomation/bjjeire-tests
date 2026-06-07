import type { BaseApiEntityModel, PaginationQuery } from '@api/support';
import type { StoreId } from '@shared/types';

export type StoreDto = BaseApiEntityModel<StoreId> &
  Readonly<{
    name: string;
    description?: string;
    websiteUrl: string;
    logoUrl?: string;
    isActive: boolean;
  }>;

export type GetStorePaginationQuery = PaginationQuery;
