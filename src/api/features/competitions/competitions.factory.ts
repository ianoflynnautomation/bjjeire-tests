import { createEntityId, createFactory } from '@api/support/factories';
import type { RunId } from '@core/types';
import type { CompetitionDto } from './competitions.api';

export function buildCompetition(runId: RunId, overrides: Partial<CompetitionDto> = {}): CompetitionDto {
  return createFactory(
    {
      id: createEntityId(),
      slug: `test-competition-${runId}`,
      name: `Test Competition ${runId}`,
      description: 'Competition created by test factory',
      organisation: 'BJJ Eire',
      country: 'Ireland',
      websiteUrl: 'https://example.com/competitions/test',
      tags: ['test'],
      isActive: true,
    },
    overrides,
  ) satisfies CompetitionDto;
}
