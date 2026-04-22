import type { BaseApiEntityModel, LocationDto, SocialMediaDto } from '@api/support/api';

export enum BjjEventType {
  OpenMat = 0,
  Seminar = 1,
  Camp = 3,
  Other = 4,
}

export enum PricingType {
  Free = 0,
  FlatRate = 1,
  PerSession = 2,
  PerDay = 3,
}

export enum EventStatus {
  Upcoming = 1,
  RegistrationOpen = 2,
  RegistrationClosed = 3,
  Ongoing = 4,
  Completed = 5,
  Canceled = 6,
  Postponed = 7,
}

export interface OrganizerDto {
  name: string;
  website: string;
}

export interface BjjEventPricingModelDto {
  type: PricingType;
  amount: number;
  durationDays?: number | null;
  currency: string;
}

export interface BjjEventHoursDto {
  day: string;
  openTime: string;
  closeTime: string;
}

export interface BjjEventScheduleDto {
  startDate?: string | null;
  endDate?: string | null;
  hours: BjjEventHoursDto[];
}

export interface BjjEventDto extends BaseApiEntityModel {
  name: string;
  description?: string | null;
  type: BjjEventType;
  organiser: OrganizerDto;
  status: EventStatus;
  statusReason?: string | null;
  socialMedia: SocialMediaDto;
  county: string;
  location: LocationDto;
  schedule: BjjEventScheduleDto;
  pricing: BjjEventPricingModelDto;
  eventUrl: string;
  imageUrl: string;
}

export interface GetBjjEventsPaginationQuery {
  county?: string | 'all';
  type?: BjjEventType | 'all';
  page?: number;
  pageSize?: number;
}
