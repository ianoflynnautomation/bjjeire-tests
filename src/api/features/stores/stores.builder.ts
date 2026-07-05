import { Builder, type IBuilder } from 'builder-pattern';
import { createEntityId } from '@api/support';
import type { RunId, StoreId } from '@shared/types';
import type { StoreDto } from './stores.api';

export function defaultStorePayload(runId: RunId): StoreDto {
  return {
    id: createEntityId() as StoreId,
    name: `Test Store ${runId}`,
    websiteUrl: 'https://example.com/stores/test-store',
    isActive: true,
  };
}

export function aStore(runId: RunId): IBuilder<StoreDto> {
  return Builder<StoreDto>(defaultStorePayload(runId));
}

export function buildStore(runId: RunId, overrides: Partial<StoreDto> = {}): StoreDto {
  return Builder<StoreDto>(defaultStorePayload(runId), overrides).build();
}
