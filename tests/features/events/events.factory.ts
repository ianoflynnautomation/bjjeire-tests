import { createEntityId } from '@lib/factories';
import type { RunId } from '@lib/types';
import type { BjjEventDto } from '@lib/api';

export function buildBjjEvent(runId: RunId, overrides: Partial<BjjEventDto> = {}): BjjEventDto {
  return {
    id: createEntityId('event', runId),
    name: `Test Event ${runId}`,
    county: 'Dublin',
    ...overrides,
  };
}
