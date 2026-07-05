import type { BaseApiEntityModel, PaginationQuery } from '@api/support';
import type { CompetitionId } from '@shared/types';

export type CompetitionDto = BaseApiEntityModel<CompetitionId> &
  Readonly<{
    slug: string;
    name: string;
    description?: string | null;
    organisation: string;
    country: string;
    websiteUrl: string;
    registrationUrl?: string | null;
    logoUrl?: string | null;
    tags: readonly string[];
    startDate?: string | null;
    endDate?: string | null;
    isActive: boolean;
  }>;

export type GetCompetitionsPaginationQuery = PaginationQuery;
