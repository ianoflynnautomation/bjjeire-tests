import type { BaseApiEntityModel, LocationDto, PaginationQuery, SocialMediaDto } from '@api/support';
import type { GymId } from '@shared/types';

export const ClassCategory = {
  Uncategorized: 'Uncategorized',
  BJJGiAllLevels: 'BJJGiAllLevels',
  BJJNoGiAllLevels: 'BJJNoGiAllLevels',
  WomensOnly: 'WomensOnly',
  Wrestling: 'Wrestling',
  MuayThai: 'MuayThai',
  Boxing: 'Boxing',
  StrengthTraining: 'StrengthTraining',
  YogaOrPilates: 'YogaOrPilates',
  KidsBJJ: 'KidsBJJ',
  BJJGiFundamentals: 'BJJGiFundamentals',
  BJJGiAdvanced: 'BJJGiAdvanced',
  BJJNoGiFundamentals: 'BJJNoGiFundamentals',
  BJJNoGiAdvanced: 'BJJNoGiAdvanced',
  CompetitionTraining: 'CompetitionTraining',
  ProTraining: 'ProTraining',
  Other: 'Other',
} as const;
export type ClassCategory = (typeof ClassCategory)[keyof typeof ClassCategory];

export const GymStatus = {
  Active: 'Active',
  PendingApproval: 'PendingApproval',
  TemporarilyClosed: 'TemporarilyClosed',
  PermanentlyClosed: 'PermanentlyClosed',
  OpeningSoon: 'OpeningSoon',
  Draft: 'Draft',
  Rejected: 'Rejected',
} as const;
export type GymStatus = (typeof GymStatus)[keyof typeof GymStatus];

export type TrialOfferDto = Readonly<{
  isAvailable: boolean;
  freeClasses?: number | null;
  freeDays?: number | null;
  notes?: string | null;
}>;

export type AffiliationDto = Readonly<{
  name: string;
  website?: string | null;
}>;

export type GymDto = BaseApiEntityModel<GymId> &
  Readonly<{
    name: string;
    description?: string | null;
    status: GymStatus;
    county: string;
    affiliation?: AffiliationDto | null;
    trialOffer: TrialOfferDto;
    location: LocationDto;
    socialMedia: SocialMediaDto;
    offeredClasses: readonly ClassCategory[];
    website?: string | null;
    timetableUrl?: string | null;
    imageUrl?: string | null;
    thumbnailUrl?: string | null;
  }>;

export type GetGymsByCountyPaginationQuery = PaginationQuery &
  Readonly<{
    county?: 'all' | (string & {});
  }>;
