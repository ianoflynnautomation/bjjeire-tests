import { createEntityId } from '@api/support/factories';
import type { RunId } from '@shared/types';
import { BjjEventType, EventStatus, PricingType, type BjjEventDto } from './events.api';

export function buildBjjEvent(runId: RunId, overrides: Partial<BjjEventDto> = {}): BjjEventDto {
  return {
    id: createEntityId(),
    name: `Test Event ${runId}`,
    description: 'Event created by test factory',
    type: BjjEventType.OpenMat,
    organiser: {
      name: 'BJJ Eire',
      website: 'https://example.com/events',
    },
    status: EventStatus.Upcoming,
    socialMedia: {},
    county: 'Dublin',
    location: {
      address: '12 Grand Canal Dock, Dublin, D02 A1B2',
      venue: 'The Arena',
      coordinates: {
        type: 'Point',
        coordinates: [-6.2395, 53.3418],
        latitude: 53.3418,
        longitude: -6.2395,
      },
    },
    schedule: {
      hours: [],
    },
    pricing: {
      type: PricingType.Free,
      amount: 0,
      currency: 'EUR',
    },
    eventUrl: 'https://example.com/events/test-event',
    imageUrl: 'https://example.com/images/test-event.jpg',
    ...overrides,
  };
}
