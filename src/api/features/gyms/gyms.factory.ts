import { createEntityId, createFactory } from '@api/support/factories';
import type { RunId } from '@core/types';
import { GymStatus, type GymDto } from './gyms.api';

export type NewGym = Omit<GymDto, 'id'> & { id: string };

export function buildGym(runId: RunId, overrides: Partial<GymDto> = {}): NewGym {
  return createFactory<NewGym>(
    {
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
          coordinates: [-6.2395, 53.3418],
          latitude: 53.3418,
          longitude: -6.2395,
        },
      },
      trialOffer: {
        isAvailable: false,
      },
      offeredClasses: [],
    },
    overrides,
  );
}

export function buildGyms(runId: RunId, count: number, overrides: Partial<GymDto> = {}): NewGym[] {
  return Array.from({ length: count }, (_, i) =>
    buildGym(runId, { ...overrides, name: `${overrides.name ?? 'Test Gym'} ${i + 1}` }),
  );
}
