import type { BjjEventDto } from '@api/features/events/events.types';
import type { BjjEventCard } from './events.types';

export type ExpectedEventCard = Pick<BjjEventCard, 'name' | 'type' | 'county' | 'pricing'>;

export function eventCardFromDto(event: BjjEventDto): ExpectedEventCard {
  return {
    name: event.name,
    type: 'EVENT',
    county: event.county,
    pricing: `${event.pricing.currency} ${event.pricing.amount.toFixed(2)}`,
  };
}
