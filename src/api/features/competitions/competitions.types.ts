import type { BaseApiEntityModel, PaginationQuery } from '@api/support/api';

export type CompetitionDto = BaseApiEntityModel &
  Readonly<{
    slug: string;
    name: string;
    description?: string;
    organisation: string;
    country: string;
    websiteUrl: string;
    registrationUrl?: string;
    logoUrl?: string;
    tags: readonly string[];
    startDate?: string;
    endDate?: string;
    isActive: boolean;
  }>;

export type GetCompetitionsPaginationQuery = PaginationQuery;
