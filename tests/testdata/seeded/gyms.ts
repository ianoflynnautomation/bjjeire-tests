import { ClassCategory, GymStatus, type GymDto } from '@api/features/gyms/gyms.types';
import type { GymId } from '@shared/types';
import { seededCoordinates } from './geo';
import { partialNameOf } from './partial-name';

const gymId = (id: string): GymId => id as GymId;

export const SEEDED_GYM_BLACKWATER_VALLEY: GymDto = {
  id: gymId('acce77900000000000000001'),
  name: 'Blackwater Valley BJJ',
  description: 'Acceptance-test fixture gym in Cork.',
  status: GymStatus.Active,
  county: 'Cork',
  trialOffer: { isAvailable: true, freeClasses: 1, notes: 'One free trial class.' },
  location: {
    address: '1 Riverside Walk, Fermoy, Co. Cork, Ireland',
    venue: 'Blackwater Valley BJJ',
    coordinates: seededCoordinates({ longitude: -8.2721, latitude: 52.1399 }, 'Fermoy, Co. Cork'),
  },
  socialMedia: {},
  offeredClasses: [ClassCategory.BJJGiAllLevels, ClassCategory.BJJNoGiAllLevels],
  website: 'https://blackwater-valley-bjj.example.ie/',
};

export const SEEDED_GYM_BLACKWATER_VALLEY_PARTIAL_NAME = partialNameOf(SEEDED_GYM_BLACKWATER_VALLEY, 'Blackwater');

export const SEEDED_GYM_HARBOUR_CITY: GymDto = {
  id: gymId('acce77900000000000000002'),
  name: 'Harbour City Jiu-Jitsu',
  description: 'Acceptance-test fixture gym in Cork.',
  status: GymStatus.Active,
  county: 'Cork',
  trialOffer: { isAvailable: false },
  location: {
    address: '12 Quay Street, Cork, Co. Cork, Ireland',
    venue: 'Harbour City Jiu-Jitsu',
    coordinates: seededCoordinates({ longitude: -8.4706, latitude: 51.8985 }, 'Cork City, Co. Cork'),
  },
  socialMedia: {},
  offeredClasses: [ClassCategory.BJJGiAllLevels, ClassCategory.KidsBJJ],
  website: 'https://harbour-city-jiu-jitsu.example.ie/',
};

export const SEEDED_GYM_LIFFEY_GRAPPLING: GymDto = {
  id: gymId('acce77900000000000000003'),
  name: 'Liffey Grappling Club',
  description: 'Acceptance-test fixture gym in Dublin.',
  status: GymStatus.Active,
  county: 'Dublin',
  trialOffer: { isAvailable: true, freeDays: 7, notes: 'One free trial week.' },
  location: {
    address: '34 Ormond Quay, Dublin 1, Ireland',
    venue: 'Liffey Grappling Club',
    coordinates: seededCoordinates({ longitude: -6.2673, latitude: 53.3465 }, 'Dublin City, Co. Dublin'),
  },
  socialMedia: {},
  offeredClasses: [ClassCategory.BJJGiAllLevels, ClassCategory.BJJNoGiAllLevels, ClassCategory.WomensOnly],
  website: 'https://liffey-grappling-club.example.ie/',
};

export const SEEDED_GYM_NORTHSIDE_MAT_ROOM: GymDto = {
  id: gymId('acce77900000000000000004'),
  name: 'Northside Mat Room',
  description: 'Acceptance-test fixture gym in Dublin.',
  status: GymStatus.Active,
  county: 'Dublin',
  trialOffer: { isAvailable: false },
  location: {
    address: '8 Swords Road, Santry, Dublin 9, Ireland',
    venue: 'Northside Mat Room',
    coordinates: seededCoordinates({ longitude: -6.254, latitude: 53.398 }, 'Santry, Co. Dublin'),
  },
  socialMedia: {},
  offeredClasses: [ClassCategory.BJJNoGiAllLevels, ClassCategory.Wrestling],
  website: 'https://northside-mat-room.example.ie/',
};

export const SEEDED_GYMS_BY_NAME: readonly GymDto[] = [
  SEEDED_GYM_BLACKWATER_VALLEY,
  SEEDED_GYM_HARBOUR_CITY,
  SEEDED_GYM_LIFFEY_GRAPPLING,
  SEEDED_GYM_NORTHSIDE_MAT_ROOM,
];
