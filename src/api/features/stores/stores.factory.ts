import { createEntityId } from '@api/support/factories';
import type { RunId } from '@shared/types';
import type { StoreDto } from './stores.api';

export function buildStore(runId: RunId, overrides: Partial<StoreDto> = {}): StoreDto {
  return {
    id: createEntityId(),
    name: `Test Store ${runId}`,
    websiteUrl: 'https://example.com/stores/test-store',
    isActive: true,
    ...overrides,
  };
}
