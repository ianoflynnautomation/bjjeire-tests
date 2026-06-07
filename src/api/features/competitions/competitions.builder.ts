import { Builder, type IBuilder } from 'builder-pattern';
import { createEntityId } from '@api/support';
import type { CompetitionId, RunId } from '@shared/types';
import type { CompetitionDto } from './competitions.api';

const DEFAULT_TAGS: readonly string[] = ['test'];

export function defaultCompetitionPayload(runId: RunId): CompetitionDto {
  return {
    id: createEntityId<CompetitionId>(),
    slug: `test-competition-${runId}`,
    name: `Test Competition ${runId}`,
    description: 'Competition created by test factory',
    organisation: 'BJJ Eire',
    country: 'Ireland',
    websiteUrl: 'https://example.com/competitions/test',
    tags: DEFAULT_TAGS,
    isActive: true,
  };
}

export function aCompetition(runId: RunId): IBuilder<CompetitionDto> {
  return Builder<CompetitionDto>(defaultCompetitionPayload(runId));
}

export function buildCompetition(runId: RunId, overrides: Partial<CompetitionDto> = {}): CompetitionDto {
  return Builder<CompetitionDto>(defaultCompetitionPayload(runId), overrides).build();
}
