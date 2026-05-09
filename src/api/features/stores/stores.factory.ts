import { createEntityId, defineFactory } from '@api/support/factories';
import type { RunId } from '@shared/types';
import type { StoreDto } from './stores.api';

const storeFactory = defineFactory<RunId, StoreDto>({
  defaults: runId => ({
    id: createEntityId(),
    name: `Test Store ${runId}`,
    websiteUrl: 'https://example.com/stores/test-store',
    isActive: true,
  }),
});

export const buildStore = storeFactory.build;
