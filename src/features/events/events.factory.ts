import { createEntityId, createFactory } from '@shared/factories';
import type { RunId } from '@core/types';
import type { BjjEventDto } from '@shared/api';

export function buildBjjEvent(runId: RunId, overrides: Partial<BjjEventDto> = {}): BjjEventDto {
  return createFactory(
    {
      id: createEntityId('event', runId),
      name: `Test Event ${runId}`,
      county: 'Dublin',
    },
    overrides,
  );
}
