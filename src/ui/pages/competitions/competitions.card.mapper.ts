import type { CompetitionDto } from '@api/features/competitions/competitions.types';
import type { CompetitionCard } from './competitions.types';

export type ExpectedCompetitionCard = Pick<CompetitionCard, 'name' | 'description' | 'tags'>;

export function competitionCardFromDto(competition: CompetitionDto): ExpectedCompetitionCard {
  return {
    name: competition.name,
    description: competition.description ?? null,
    tags: [...competition.tags],
  };
}
