import { createEntityId } from '@lib/factories';
import type { RunId } from '@lib/types';
import type { CompetitionDto } from '@lib/api';

export function buildCompetition(runId: RunId, overrides: Partial<CompetitionDto> = {}): CompetitionDto {
  return {
    id: createEntityId('comp', runId),
    name: `Test Competition ${runId}`,
    ...overrides,
  };
}
