import { createEntityId, createFactory } from '@shared/factories';
import type { RunId } from '@core/types';
import type { StoreDto } from '@shared/api';

export function buildStore(runId: RunId, overrides: Partial<StoreDto> = {}): StoreDto {
  return createFactory(
    {
      id: createEntityId('store', runId),
      name: `Test Store ${runId}`,
    },
    overrides,
  );
}
