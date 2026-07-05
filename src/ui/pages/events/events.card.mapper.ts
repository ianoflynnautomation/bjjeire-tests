import { BjjEventType, type BjjEventDto } from '@api/features/events/events.types';
import type { BjjEventCard } from './events.types';

export type ExpectedEventCard = Pick<BjjEventCard, 'name' | 'type' | 'county' | 'pricing'>;

const EVENT_TYPE_BADGES: Record<BjjEventType, string> = {
  [BjjEventType.OpenMat]: 'EVENT',
  [BjjEventType.Seminar]: 'SEMINAR',
  [BjjEventType.Camp]: 'CAMP',
  [BjjEventType.Other]: 'OTHER',
};

export function eventCardFromDto(event: BjjEventDto): ExpectedEventCard {
  return {
    name: event.name,
    type: EVENT_TYPE_BADGES[event.type],
    county: event.county,
    pricing: `${event.pricing.currency} ${event.pricing.amount.toFixed(2)}`,
  };
}
