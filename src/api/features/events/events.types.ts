import type { BaseApiEntityModel, LocationDto, PaginationQuery, SocialMediaDto } from '@api/support/api';

export const BjjEventType = {
  OpenMat: 0,
  Seminar: 1,
  Camp: 3,
  Other: 4,
} as const;
export type BjjEventType = (typeof BjjEventType)[keyof typeof BjjEventType];

export const PricingType = {
  Free: 0,
  FlatRate: 1,
  PerSession: 2,
  PerDay: 3,
} as const;
export type PricingType = (typeof PricingType)[keyof typeof PricingType];

export const EventStatus = {
  Upcoming: 1,
  RegistrationOpen: 2,
  RegistrationClosed: 3,
  Ongoing: 4,
  Completed: 5,
  Canceled: 6,
  Postponed: 7,
} as const;
export type EventStatus = (typeof EventStatus)[keyof typeof EventStatus];

export type OrganizerDto = Readonly<{
  name: string;
  website: string;
}>;

export type BjjEventPricingModelDto = Readonly<{
  type: PricingType;
  amount: number;
  durationDays?: number | null;
  currency: string;
}>;

export type BjjEventHoursDto = Readonly<{
  day: string;
  openTime: string;
  closeTime: string;
}>;

export type BjjEventScheduleDto = Readonly<{
  startDate?: string | null;
  endDate?: string | null;
  hours: readonly BjjEventHoursDto[];
}>;

export type BjjEventDto = BaseApiEntityModel &
  Readonly<{
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
  }>;

export type GetBjjEventsPaginationQuery = PaginationQuery &
  Readonly<{
    county?: 'all' | (string & {});
    type?: 'all' | BjjEventType;
  }>;
