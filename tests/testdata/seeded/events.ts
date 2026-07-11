import {
  BjjEventType,
  EventStatus,
  PricingType,
  ScheduleKind,
  type BjjEventDto,
} from '@api/features/events/events.types';
import type { EventId } from '@shared/types';
import { seededCoordinates } from './geo';
import { partialNameOf } from './partial-name';

const eventId = (id: string): EventId => id as EventId;

const EMPTY_FIXED_SCHEDULE = { kind: ScheduleKind.FixedDates, sessions: [] } as const;

export const SEEDED_EVENT_LEINSTER_OPEN_MAT: BjjEventDto = {
  id: eventId('acce77e00000000000000001'),
  name: 'Leinster Community Open Mat',
  description: 'Acceptance-test fixture event in Dublin (upcoming).',
  types: [BjjEventType.OpenMat],
  organiser: { name: 'Leinster Grappling Collective', website: 'https://leinster-grappling.example.ie/' },
  status: EventStatus.Upcoming,
  socialMedia: {},
  county: 'Dublin',
  location: {
    address: '2 Mat Lane, Dublin 8, Ireland',
    venue: 'Leinster Grappling HQ',
    coordinates: seededCoordinates({ longitude: -6.2889, latitude: 53.3382 }, 'Dublin 8, Co. Dublin'),
  },
  schedule: EMPTY_FIXED_SCHEDULE,
  pricingOptions: [{ type: PricingType.Free, amount: 0, currency: 'EUR' }],
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
  types: [BjjEventType.Seminar],
  organiser: { name: 'Rebel County BJJ', website: 'https://rebel-county-bjj.example.ie/' },
  status: EventStatus.RegistrationOpen,
  socialMedia: {},
  county: 'Cork',
  location: {
    address: '5 Academy Street, Cork, Co. Cork, Ireland',
    venue: 'Rebel County BJJ Academy',
    coordinates: seededCoordinates({ longitude: -8.468, latitude: 51.8998 }, 'Cork City, Co. Cork'),
  },
  schedule: EMPTY_FIXED_SCHEDULE,
  pricingOptions: [
    { type: PricingType.FlatRate, amount: 40, currency: 'EUR' },
    { type: PricingType.Free, label: 'Spectators', amount: 0, currency: 'EUR' },
  ],
  eventUrl: 'https://rebel-county-bjj.example.ie/seminar',
  imageUrl: '/images/events/acce77e00000000000000002/lg.webp',
};

export const SEEDED_EVENT_TRIBES_NO_GI_CAMP: BjjEventDto = {
  id: eventId('acce77e00000000000000003'),
  name: 'Tribes No-Gi Camp Galway',
  description: 'Acceptance-test fixture event in Galway (upcoming).',
  types: [BjjEventType.Camp],
  organiser: { name: 'Tribes Grappling', website: 'https://tribes-grappling.example.ie/' },
  status: EventStatus.Upcoming,
  socialMedia: {},
  county: 'Galway',
  location: {
    address: '9 Salthill Road, Galway, Co. Galway, Ireland',
    venue: 'Tribes Grappling Centre',
    coordinates: seededCoordinates({ longitude: -9.0724, latitude: 53.262 }, 'Salthill, Co. Galway'),
  },
  schedule: EMPTY_FIXED_SCHEDULE,
  pricingOptions: [{ type: PricingType.PerDay, amount: 55, durationDays: 3, currency: 'EUR' }],
  eventUrl: 'https://tribes-grappling.example.ie/no-gi-camp',
  imageUrl: '/images/events/acce77e00000000000000003/lg.webp',
};

export const SEEDED_EVENT_ATLANTIC_COAST_CAMP: BjjEventDto = {
  id: eventId('acce77e00000000000000005'),
  name: 'Atlantic Coast Camp and Open Mat',
  description:
    'Acceptance-test fixture: multi-type event (camp with open mat day) using per-type pricing and dated sessions.',
  types: [BjjEventType.Camp, BjjEventType.OpenMat],
  organiser: { name: 'Atlantic Coast Grappling', website: 'https://atlantic-grappling.example.ie/' },
  status: EventStatus.RegistrationOpen,
  socialMedia: {},
  county: 'Mayo',
  location: {
    address: '4 Quay Road, Westport, Co. Mayo, Ireland',
    venue: 'Atlantic Coast Grappling Hall',
    coordinates: seededCoordinates({ longitude: -9.5145, latitude: 53.8008 }, 'Westport, Co. Mayo'),
  },
  // Session dates resolve relative to seed time, so they are omitted here —
  // toMatchObject checks the expected fields as a subset per session
  schedule: {
    kind: ScheduleKind.FixedDates,
    sessions: [
      { startTime: '10:00:00', endTime: '16:00:00', title: 'Day 1 - Gi Camp', types: [BjjEventType.Camp] },
      { startTime: '10:00:00', endTime: '16:00:00', title: 'Day 2 - No-Gi Camp', types: [BjjEventType.Camp] },
      { startTime: '10:00:00', endTime: '13:00:00', title: 'Day 3 - Open Mat', types: [BjjEventType.OpenMat] },
    ],
  },
  pricingOptions: [
    {
      type: PricingType.FlatRate,
      label: 'Full camp',
      appliesToTypes: [BjjEventType.Camp],
      amount: 180,
      durationDays: 3,
      currency: 'EUR',
    },
    {
      type: PricingType.PerDay,
      label: 'Open mat day pass',
      appliesToTypes: [BjjEventType.OpenMat],
      amount: 20,
      durationDays: 1,
      currency: 'EUR',
    },
  ],
  eventUrl: 'https://atlantic-grappling.example.ie/coast-camp',
  imageUrl: '/images/events/acce77e00000000000000005/lg.webp',
};

export const SEEDED_EVENT_SHANNONSIDE_WEEKLY_OPEN_MAT: BjjEventDto = {
  id: eventId('acce77e00000000000000006'),
  name: 'Shannonside Weekly Open Mat',
  description: 'Acceptance-test fixture: weekly recurring schedule with per-session pricing.',
  types: [BjjEventType.OpenMat],
  organiser: { name: 'Shannonside Grappling Club', website: 'https://shannonside-grappling.example.ie/' },
  status: EventStatus.Upcoming,
  socialMedia: {},
  county: 'Limerick',
  location: {
    address: '18 Dock Road, Limerick, Co. Limerick, Ireland',
    venue: 'Shannonside Grappling Club',
    coordinates: seededCoordinates({ longitude: -8.6335, latitude: 52.6603 }, 'Limerick City, Co. Limerick'),
  },
  schedule: {
    kind: ScheduleKind.WeeklyRecurring,
    sessions: [
      { day: 'Wednesday', startTime: '19:00:00', endTime: '21:00:00' },
      { day: 'Friday', startTime: '18:30:00', endTime: '20:30:00' },
    ],
  },
  pricingOptions: [{ type: PricingType.PerSession, label: 'Mat fee', amount: 10, currency: 'EUR' }],
  eventUrl: 'https://shannonside-grappling.example.ie/open-mat',
  imageUrl: '/images/events/acce77e00000000000000006/lg.webp',
};

export const SEEDED_EVENT_FINISHED_WINTER_SOLSTICE: BjjEventDto = {
  id: eventId('acce77e00000000000000004'),
  name: 'Winter Solstice Open Mat',
  description:
    'Acceptance-test fixture event that has already finished, used to prove past events are excluded from the published listing.',
  types: [BjjEventType.OpenMat],
  organiser: { name: 'Leinster Grappling Collective', website: 'https://leinster-grappling.example.ie/' },
  status: EventStatus.Upcoming,
  socialMedia: {},
  county: 'Dublin',
  location: {
    address: '2 Mat Lane, Dublin 8, Ireland',
    venue: 'Leinster Grappling HQ',
    coordinates: seededCoordinates({ longitude: -6.2889, latitude: 53.3382 }, 'Dublin 8, Co. Dublin'),
  },
  schedule: EMPTY_FIXED_SCHEDULE,
  pricingOptions: [{ type: PricingType.Free, amount: 0, currency: 'EUR' }],
  eventUrl: 'https://leinster-grappling.example.ie/winter-solstice',
  imageUrl: '/images/events/acce77e00000000000000004/lg.webp',
};

// Ordered by seeded createdAt — the listing order the API acceptance suite asserts
export const SEEDED_UPCOMING_EVENTS: readonly BjjEventDto[] = [
  SEEDED_EVENT_LEINSTER_OPEN_MAT,
  SEEDED_EVENT_REBEL_COUNTY_SEMINAR,
  SEEDED_EVENT_TRIBES_NO_GI_CAMP,
  SEEDED_EVENT_ATLANTIC_COAST_CAMP,
  SEEDED_EVENT_SHANNONSIDE_WEEKLY_OPEN_MAT,
];
