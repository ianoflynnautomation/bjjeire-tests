import { Builder, type IBuilder } from 'builder-pattern';
import { createEntityId } from '@api/support/factories';
import type { EventId, RunId } from '@shared/types';
import { DUBLIN_CITY_CENTRE, DUBLIN_CITY_CENTRE_GEOJSON } from '@shared/testdata/geography';
import { BjjEventType, EventStatus, PricingType } from './events.api';
import type { BjjEventDto, BjjEventPricingModelDto, BjjEventScheduleDto, OrganizerDto } from './events.types';
import type { LocationDto, SocialMediaDto } from '@api/support/api';

const DEFAULT_ORGANISER: OrganizerDto = {
  name: 'BJJ Eire',
  website: 'https://example.com/events',
};

const DEFAULT_LOCATION: LocationDto = {
  address: '12 Grand Canal Dock, Dublin, D02 A1B2',
  venue: 'The Arena',
  coordinates: {
    type: 'Point',
    coordinates: [...DUBLIN_CITY_CENTRE_GEOJSON],
    latitude: DUBLIN_CITY_CENTRE.latitude,
    longitude: DUBLIN_CITY_CENTRE.longitude,
  },
};

const DEFAULT_SCHEDULE: BjjEventScheduleDto = { hours: [] };

export const FREE_PRICING: BjjEventPricingModelDto = {
  type: PricingType.Free,
  amount: 0,
  currency: 'EUR',
};

const DEFAULT_SOCIAL_MEDIA: SocialMediaDto = {};

export function defaultEventPayload(runId: RunId): BjjEventDto {
  return {
    id: createEntityId<EventId>(),
    name: `Test Event ${runId}`,
    description: 'Event created by test factory',
    type: BjjEventType.OpenMat,
    organiser: DEFAULT_ORGANISER,
    status: EventStatus.Upcoming,
    socialMedia: DEFAULT_SOCIAL_MEDIA,
    county: 'Dublin',
    location: DEFAULT_LOCATION,
    schedule: DEFAULT_SCHEDULE,
    pricing: FREE_PRICING,
    eventUrl: 'https://example.com/events/test-event',
    imageUrl: 'https://example.com/images/test-event.jpg',
  };
}

export function anEvent(runId: RunId): IBuilder<BjjEventDto> {
  return Builder<BjjEventDto>(defaultEventPayload(runId));
}

export function buildBjjEvent(runId: RunId, overrides: Partial<BjjEventDto> = {}): BjjEventDto {
  return Builder<BjjEventDto>(defaultEventPayload(runId), overrides).build();
}
