import {
  BjjEventType,
  PricingType,
  ScheduleKind,
  type BjjEventDto,
  type BjjEventPricingModelDto,
  type BjjEventScheduleDto,
} from '@api/features/events/events.types';
import type { BjjEventCard } from './events.types';

export type ExpectedEventCard = Pick<BjjEventCard, 'name' | 'type' | 'county' | 'pricing'>;

const EVENT_TYPE_BADGES: Record<BjjEventType, string> = {
  [BjjEventType.OpenMat]: 'OPEN MAT',
  [BjjEventType.Seminar]: 'SEMINAR',
  [BjjEventType.Camp]: 'CAMP',
  [BjjEventType.Other]: 'OTHER',
};

const MS_PER_DAY = 86_400_000;

function scheduleSpanDays(schedule: BjjEventScheduleDto): number {
  if (!schedule.startDate || !schedule.endDate) return 1;
  const start = new Date(schedule.startDate);
  const end = new Date(schedule.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 1;
  return Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;
}

function sessionsInScope(schedule: BjjEventScheduleDto, option: BjjEventPricingModelDto): number {
  const sessions = schedule.sessions ?? [];
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
    const days = option.durationDays && option.durationDays > 0 ? option.durationDays : scheduleSpanDays(schedule);
    return `${label}${money(option.amount * days)} per day`;
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
  };
}
