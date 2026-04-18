import { createEntityId } from '@lib/factories';
import type { RunId } from '@lib/types';
import type { GymDto } from '@lib/api';

export type NewGym = Omit<GymDto, 'id'> & { id: string };

export function buildGym(runId: RunId, overrides: Partial<GymDto> = {}): NewGym {
  return {
    id: createEntityId('gym', runId),
    name: `Test Gym ${runId}`,
    county: 'Dublin',
    ...overrides,
  };
}

export function buildGyms(runId: RunId, count: number, overrides: Partial<GymDto> = {}): NewGym[] {
  return Array.from({ length: count }, (_, i) =>
    buildGym(runId, { ...overrides, name: `${overrides.name ?? 'Test Gym'} ${i + 1}` }),
  );
}
