import { createEntityId, createFactory } from '@shared/factories';
import type { RunId } from '@core/types';
import type { CompetitionDto } from '@shared/api';

export function buildCompetition(runId: RunId, overrides: Partial<CompetitionDto> = {}): CompetitionDto {
  return createFactory(
    {
      id: createEntityId('comp', runId),
      name: `Test Competition ${runId}`,
    },
    overrides,
  );
}
