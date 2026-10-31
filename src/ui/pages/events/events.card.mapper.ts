import {
  BjjEventType,
  PricingType,
  ScheduleKind,
  type BjjEventDto,
  type BjjEventPricingModelDto,
  type BjjEventScheduleDto,
} from '@api/features/events/events.types';
import type { BjjEventCard } from './events.types';

export type ExpectedEventCard = Pick<
  BjjEventCard,
  | 'name'
  | 'type'
  | 'county'
  | 'pricing'
  | 'sessions'
  | 'address'
  | 'mapUrl'
  | 'organiser'
  | 'organiserUrl'
  | 'moreInfoUrl'
>;

const GOOGLE_MAPS_SEARCH = 'https://www.google.com/maps/search/?api=1&query=';
const NOON_HOUR = 12;

// "19:00:00" → "7:00 PM", as the card renders session times.
function clockTime(time: string): string {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  const suffix = hours >= NOON_HOUR ? 'PM' : 'AM';
  const hour12 = hours % NOON_HOUR || NOON_HOUR;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

// Weekly sessions lead with the day; fixed-date ones lead with a seed-relative date the
// card reader strips, so the expectation is the time span and the title.
function sessionLine(schedule: BjjEventScheduleDto, session: BjjEventScheduleDto['sessions'][number]): string {
  const span = `${clockTime(session.startTime)}–${clockTime(session.endTime)}`;
  const title = session.title ? ` · ${session.title}` : '';
  return schedule.kind === ScheduleKind.WeeklyRecurring && session.day
    ? `${session.day}: ${span}${title}`
    : `${span}${title}`;
}

const EVENT_TYPE_BADGES: Record<BjjEventType, string> = {
  [BjjEventType.OpenMat]: 'OPEN MAT',
  [BjjEventType.Seminar]: 'SEMINAR',
  [BjjEventType.Camp]: 'CAMP',
  [BjjEventType.Other]: 'OTHER',
};

function sessionsInScope(schedule: BjjEventScheduleDto, option: BjjEventPricingModelDto): number {
  const sessions = schedule.sessions;
  if (sessions.length === 0) return 1;
  const scope = option.appliesToTypes ?? [];
  if (scope.length === 0) return sessions.length;
  // Untagged sessions belong to every event type
  const matching = sessions.filter(s => !s.types?.length || s.types.some(t => scope.includes(t)));
  return Math.max(matching.length, 1);
}

// Mirrors the frontend price display (src/utils/price-calculator.ts + format-event-details.ts)
function pricingDisplay(schedule: BjjEventScheduleDto, option: BjjEventPricingModelDto): string {
  const label = option.label ? `${option.label}: ` : '';
  if (option.type === PricingType.Free) return `${label}Free`;

  const isWeekly = schedule.kind === ScheduleKind.WeeklyRecurring;
  const money = (total: number): string => `${option.currency} ${total.toFixed(2)}`;

  if (option.type === PricingType.PerSession) {
    const total = option.amount * sessionsInScope(schedule, option);
    return `${label}${money(total)} ${isWeekly ? 'per week' : 'per session'}`;
  }

  if (option.type === PricingType.PerDay) {
    if (isWeekly) {
      return `${label}${money(option.amount * sessionsInScope(schedule, option))} per week`;
    }
    return `${label}${money(option.amount)} per day`;
  }

  return `${label}${money(option.amount)}`;
}

export function eventCardFromDto(event: BjjEventDto): ExpectedEventCard {
  return {
    name: event.name,
    type: event.types.map(type => EVENT_TYPE_BADGES[type]).join(' '),
    county: event.county,
    pricing: event.pricingOptions.length
      ? event.pricingOptions.map(option => pricingDisplay(event.schedule, option)).join(' | ')
      : null,
    sessions: event.schedule.sessions.map(session => sessionLine(event.schedule, session)),
    address: event.location.address,
    mapUrl: `${GOOGLE_MAPS_SEARCH}${event.location.coordinates.latitude},${event.location.coordinates.longitude}`,
    organiser: `Organised by: ${event.organiser.name}`,
    organiserUrl: event.organiser.website,
    moreInfoUrl: event.eventUrl,
  };
}
