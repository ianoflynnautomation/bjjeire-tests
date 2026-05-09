import type { BaseApiEntityModel, PaginationQuery } from '@api/support/api';

export type StoreDto = BaseApiEntityModel &
  Readonly<{
    name: string;
    description?: string;
    websiteUrl: string;
    logoUrl?: string;
    isActive: boolean;
  }>;

export type GetStorePaginationQuery = PaginationQuery;
