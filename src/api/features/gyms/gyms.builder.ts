import { Builder, type IBuilder } from 'builder-pattern';
import { createEntityId } from '@api/support';
import type { GymId, RunId } from '@shared/types';
import { DUBLIN_CITY_CENTRE, DUBLIN_CITY_CENTRE_GEOJSON } from '@shared/testdata/geography';
import { GymStatus } from './gyms.api';
import type { ClassCategory, GymDto, TrialOfferDto } from './gyms.types';
import type { LocationDto, SocialMediaDto } from '@api/support';

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

const DEFAULT_TRIAL_OFFER: TrialOfferDto = { isAvailable: false };
const DEFAULT_SOCIAL_MEDIA: SocialMediaDto = {};
const DEFAULT_OFFERED_CLASSES: readonly ClassCategory[] = [];

export function defaultGymPayload(runId: RunId): GymDto {
  return {
    id: createEntityId<GymId>(),
    name: `Test Gym ${runId}`,
    status: GymStatus.Active,
    county: 'Dublin',
    socialMedia: DEFAULT_SOCIAL_MEDIA,
    location: DEFAULT_LOCATION,
    trialOffer: DEFAULT_TRIAL_OFFER,
    offeredClasses: DEFAULT_OFFERED_CLASSES,
  };
}

export function aGym(runId: RunId): IBuilder<GymDto> {
  return Builder<GymDto>(defaultGymPayload(runId));
}

export function buildGym(runId: RunId, overrides: Partial<GymDto> = {}): GymDto {
  return Builder<GymDto>(defaultGymPayload(runId), overrides).build();
}
