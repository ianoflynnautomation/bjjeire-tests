import type { BaseApiEntityModel } from '@api/support/api';

export interface StoreDto extends BaseApiEntityModel {
  name: string;
  description?: string;
  websiteUrl: string;
  logoUrl?: string;
  isActive: boolean;
}

export interface GetStorePaginationQuery {
  page?: number;
  pageSize?: number;
}
