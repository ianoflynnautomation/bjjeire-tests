import { createEntityId, defineFactory } from '@api/support/factories';
import type { RunId } from '@shared/types';
import { GymStatus } from './gyms.api';
import type { GymDto } from './gyms.api';

const gymFactory = defineFactory<RunId, GymDto>({
  defaults: runId => ({
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
    trialOffer: { isAvailable: false },
    offeredClasses: [],
  }),
});

export const buildGym = gymFactory.build;
