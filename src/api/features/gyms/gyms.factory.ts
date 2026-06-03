import { createEntityId } from '@api/support/factories';
import type { RunId } from '@shared/types';
import { DUBLIN_CITY_CENTRE, DUBLIN_CITY_CENTRE_GEOJSON } from '@shared/testdata/geography';
import { GymStatus } from './gyms.api';
import type { GymDto } from './gyms.api';

export function buildGym(runId: RunId, overrides: Partial<GymDto> = {}): GymDto {
  return {
    id: createEntityId(),
    name: `Test Gym ${runId}`,
    status: GymStatus.Active,
    county: 'Dublin',
    socialMedia: {},
    location: {
      address: '12 Grand Canal Dock, Dublin, D02 A1B2',
      venue: 'The Arena',
      coordinates: {
        type: 'Point',
        coordinates: [...DUBLIN_CITY_CENTRE_GEOJSON],
        latitude: DUBLIN_CITY_CENTRE.latitude,
        longitude: DUBLIN_CITY_CENTRE.longitude,
      },
    },
    trialOffer: { isAvailable: false },
    offeredClasses: [],
    ...overrides,
  };
}
