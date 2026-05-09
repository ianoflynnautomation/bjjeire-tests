import { createEntityId, defineFactory } from '@api/support/factories';
import type { RunId } from '@shared/types';
import type { CompetitionDto } from './competitions.api';

const competitionFactory = defineFactory<RunId, CompetitionDto>({
  defaults: runId => ({
    id: createEntityId(),
    slug: `test-competition-${runId}`,
    name: `Test Competition ${runId}`,
    description: 'Competition created by test factory',
    organisation: 'BJJ Eire',
    country: 'Ireland',
    websiteUrl: 'https://example.com/competitions/test',
    tags: ['test'],
    isActive: true,
  }),
});

export const buildCompetition = competitionFactory.build;
