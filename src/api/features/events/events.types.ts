import type { BaseApiEntityModel, LocationDto, PaginationQuery, SocialMediaDto } from '@api/support';
import type { EventId } from '@shared/types';

export const BjjEventType = {
  OpenMat: 'OpenMat',
  Seminar: 'Seminar',
  Camp: 'Camp',
  Other: 'Other',
} as const;
export type BjjEventType = (typeof BjjEventType)[keyof typeof BjjEventType];

export const PricingType = {
  Free: 'Free',
  FlatRate: 'FlatRate',
  PerSession: 'PerSession',
  PerDay: 'PerDay',
} as const;
export type PricingType = (typeof PricingType)[keyof typeof PricingType];

export const EventStatus = {
  Upcoming: 'Upcoming',
  RegistrationOpen: 'RegistrationOpen',
  RegistrationClosed: 'RegistrationClosed',
  Ongoing: 'Ongoing',
  Completed: 'Completed',
  Canceled: 'Canceled',
  Postponed: 'Postponed',
} as const;
export type EventStatus = (typeof EventStatus)[keyof typeof EventStatus];

export const ScheduleKind = {
  FixedDates: 'FixedDates',
  WeeklyRecurring: 'WeeklyRecurring',
} as const;
export type ScheduleKind = (typeof ScheduleKind)[keyof typeof ScheduleKind];

export type OrganizerDto = Readonly<{
  name: string;
  website: string;
}>;

export type BjjEventPricingModelDto = Readonly<{
  type: PricingType;
  label?: string | null;
  appliesToTypes?: readonly BjjEventType[] | null;
  amount: number;
  durationDays?: number | null;
  currency: string;
}>;

export type BjjEventSessionDto = Readonly<{
  date?: string | null;
  day?: string | null;
  startTime: string;
  endTime: string;
  title?: string | null;
  types?: readonly BjjEventType[] | null;
}>;

export type BjjEventScheduleDto = Readonly<{
  kind: ScheduleKind;
  startDate?: string | null;
  endDate?: string | null;
  sessions: readonly BjjEventSessionDto[];
}>;

export type BjjEventDto = BaseApiEntityModel<EventId> &
  Readonly<{
    name: string;
    description?: string | null;
    types: readonly BjjEventType[];
    organiser: OrganizerDto;
    status: EventStatus;
    statusReason?: string | null;
    socialMedia: SocialMediaDto;
    county: string;
    location: LocationDto;
    schedule: BjjEventScheduleDto;
    pricingOptions: readonly BjjEventPricingModelDto[];
    eventUrl: string;
    imageUrl: string;
  }>;

export type GetBjjEventsPaginationQuery = PaginationQuery &
  Readonly<{
    county?: 'all' | (string & {});
    types?: readonly BjjEventType[];
  }>;
