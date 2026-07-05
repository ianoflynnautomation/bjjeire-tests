import { BjjEventType, EventStatus, PricingType, type BjjEventDto } from '@api/features/events/events.types';
import type { EventId } from '@shared/types';
import { seededCoordinates } from './geo';
import { partialNameOf } from './partial-name';

const eventId = (id: string): EventId => id as EventId;

export const SEEDED_EVENT_LEINSTER_OPEN_MAT: BjjEventDto = {
  id: eventId('acce77e00000000000000001'),
  name: 'Leinster Community Open Mat',
  description: 'Acceptance-test fixture event in Dublin (upcoming).',
  type: BjjEventType.OpenMat,
  organiser: { name: 'Leinster Grappling Collective', website: 'https://leinster-grappling.example.ie/' },
  status: EventStatus.Upcoming,
  socialMedia: {},
  county: 'Dublin',
  location: {
    address: '2 Mat Lane, Dublin 8, Ireland',
    venue: 'Leinster Grappling HQ',
    coordinates: seededCoordinates({ longitude: -6.2889, latitude: 53.3382 }, 'Dublin 8, Co. Dublin'),
  },
  schedule: { hours: [] },
  pricing: { type: PricingType.Free, amount: 0, currency: 'EUR' },
  eventUrl: 'https://leinster-grappling.example.ie/open-mat',
  imageUrl: '/images/events/acce77e00000000000000001/lg.webp',
};

export const SEEDED_EVENT_LEINSTER_OPEN_MAT_PARTIAL_NAME = partialNameOf(
  SEEDED_EVENT_LEINSTER_OPEN_MAT,
  'Leinster Community',
);

export const SEEDED_EVENT_REBEL_COUNTY_SEMINAR: BjjEventDto = {
  id: eventId('acce77e00000000000000002'),
  name: 'Rebel County Submission Seminar',
  description: 'Acceptance-test fixture event in Cork (upcoming).',
  type: BjjEventType.Seminar,
  organiser: { name: 'Rebel County BJJ', website: 'https://rebel-county-bjj.example.ie/' },
  status: EventStatus.RegistrationOpen,
  socialMedia: {},
  county: 'Cork',
  location: {
    address: '5 Academy Street, Cork, Co. Cork, Ireland',
    venue: 'Rebel County BJJ Academy',
    coordinates: seededCoordinates({ longitude: -8.468, latitude: 51.8998 }, 'Cork City, Co. Cork'),
  },
  schedule: { hours: [] },
  pricing: { type: PricingType.FlatRate, amount: 40, currency: 'EUR' },
  eventUrl: 'https://rebel-county-bjj.example.ie/seminar',
  imageUrl: '/images/events/acce77e00000000000000002/lg.webp',
};

export const SEEDED_EVENT_TRIBES_NO_GI_CAMP: BjjEventDto = {
  id: eventId('acce77e00000000000000003'),
  name: 'Tribes No-Gi Camp Galway',
  description: 'Acceptance-test fixture event in Galway (upcoming).',
  type: BjjEventType.Camp,
  organiser: { name: 'Tribes Grappling', website: 'https://tribes-grappling.example.ie/' },
  status: EventStatus.Upcoming,
  socialMedia: {},
  county: 'Galway',
  location: {
    address: '9 Salthill Road, Galway, Co. Galway, Ireland',
    venue: 'Tribes Grappling Centre',
    coordinates: seededCoordinates({ longitude: -9.0724, latitude: 53.262 }, 'Salthill, Co. Galway'),
  },
  schedule: { hours: [] },
  pricing: { type: PricingType.PerDay, amount: 55, durationDays: 3, currency: 'EUR' },
  eventUrl: 'https://tribes-grappling.example.ie/no-gi-camp',
  imageUrl: '/images/events/acce77e00000000000000003/lg.webp',
};

export const SEEDED_EVENT_FINISHED_WINTER_SOLSTICE: BjjEventDto = {
  id: eventId('acce77e00000000000000004'),
  name: 'Winter Solstice Open Mat',
  description:
    'Acceptance-test fixture event that has already finished, used to prove past events are excluded from the published listing.',
  type: BjjEventType.OpenMat,
  organiser: { name: 'Leinster Grappling Collective', website: 'https://leinster-grappling.example.ie/' },
  status: EventStatus.Upcoming,
  socialMedia: {},
  county: 'Dublin',
  location: {
    address: '2 Mat Lane, Dublin 8, Ireland',
    venue: 'Leinster Grappling HQ',
    coordinates: seededCoordinates({ longitude: -6.2889, latitude: 53.3382 }, 'Dublin 8, Co. Dublin'),
  },
  schedule: { hours: [] },
  pricing: { type: PricingType.Free, amount: 0, currency: 'EUR' },
  eventUrl: 'https://leinster-grappling.example.ie/winter-solstice',
  imageUrl: '/images/events/acce77e00000000000000004/lg.webp',
};

export const SEEDED_UPCOMING_EVENTS: readonly BjjEventDto[] = [
  SEEDED_EVENT_LEINSTER_OPEN_MAT,
  SEEDED_EVENT_REBEL_COUNTY_SEMINAR,
  SEEDED_EVENT_TRIBES_NO_GI_CAMP,
];
