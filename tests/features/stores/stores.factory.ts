import { createEntityId } from '@lib/factories';
import type { RunId } from '@lib/types';
import type { StoreDto } from '@lib/api';

export function buildStore(runId: RunId, overrides: Partial<StoreDto> = {}): StoreDto {
  return {
    id: createEntityId('store', runId),
    name: `Test Store ${runId}`,
    ...overrides,
  };
}
