import type { CompetitionDto } from '@api/features/competitions/competitions.types';
import type { CompetitionCard, CompetitionCardLinks } from './competitions.types';

export type ExpectedCompetitionCard = Pick<CompetitionCard, 'name' | 'description' | 'tags'>;

export function competitionCardFromDto(competition: CompetitionDto): ExpectedCompetitionCard {
  return {
    name: competition.name,
    description: competition.description ?? null,
    tags: [...competition.tags],
  };
}

export function competitionCardLinksFromDto(competition: CompetitionDto): CompetitionCardLinks {
  if (!competition.registrationUrl) {
    throw new Error(`Competition '${competition.name}' has no registration link to assert.`);
  }
  return {
    name: competition.name,
    website: competition.websiteUrl,
    registration: competition.registrationUrl,
  };
}
