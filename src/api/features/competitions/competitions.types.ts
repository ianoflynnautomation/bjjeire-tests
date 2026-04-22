import type { BaseApiEntityModel } from '@api/support/api';

export interface CompetitionDto extends BaseApiEntityModel {
  slug: string;
  name: string;
  description?: string;
  organisation: string;
  country: string;
  websiteUrl: string;
  registrationUrl?: string;
  logoUrl?: string;
  tags: string[];
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

export interface GetCompetitionsPaginationQuery {
  page?: number;
  pageSize?: number;
}
