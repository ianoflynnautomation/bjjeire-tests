import type { BaseApiEntityModel, LocationDto, SocialMediaDto } from '@api/support/api';

export enum ClassCategory {
  Uncategorized = 'Uncategorized',
  BJJGiAllLevels = 'BJJGiAllLevels',
  BJJNoGiAllLevels = 'BJJNoGiAllLevels',
  WomensOnly = 'WomensOnly',
  Wrestling = 'Wrestling',
  MuayThai = 'MuayThai',
  Boxing = 'Boxing',
  StrengthTraining = 'StrengthTraining',
  YogaOrPilates = 'YogaOrPilates',
  KidsBJJ = 'KidsBJJ',
  BJJGiFundamentals = 'BJJGiFundamentals',
  BJJGiAdvanced = 'BJJGiAdvanced',
  BJJNoGiFundamentals = 'BJJNoGiFundamentals',
  BJJNoGiAdvanced = 'BJJNoGiAdvanced',
  CompetitionTraining = 'CompetitionTraining',
  ProTraining = 'ProTraining',
  Other = 'Other',
}

export enum GymStatus {
  Active = 'Active',
  PendingApproval = 'PendingApproval',
  TemporarilyClosed = 'TemporarilyClosed',
  PermanentlyClosed = 'PermanentlyClosed',
  OpeningSoon = 'OpeningSoon',
  Draft = 'Draft',
  Rejected = 'Rejected',
}

export interface TrialOfferDto {
  isAvailable: boolean;
  freeClasses?: number;
  freeDays?: number;
  notes?: string;
}

export interface AffiliationDto {
  name: string;
  website?: string;
}

export interface GymDto extends BaseApiEntityModel {
  name: string;
  description?: string;
  status: GymStatus;
  county: string;
  affiliation?: AffiliationDto;
  trialOffer: TrialOfferDto;
  location: LocationDto;
  socialMedia: SocialMediaDto;
  offeredClasses: ClassCategory[];
  website?: string;
  timetableUrl?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
}

export interface GetGymsByCountyPaginationQuery {
  county?: string | 'all';
  page?: number;
  pageSize?: number;
}
