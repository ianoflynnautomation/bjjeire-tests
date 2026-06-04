import type { CompetitionCard } from '@ui/pages/competitions/competitions.card.page';

export const SEEDED_COMPETITION_ADCC: CompetitionCard = {
  name: 'ADCC Irish Open Championship 2026',
  organisation: null,
  date: '5 September 2026',
  description: 'ADCC-style No-Gi submission grappling open championship for Ireland.',
  tags: ['adcc', 'no-gi', 'submission-grappling', 'open'],
} as const;

export const SEEDED_COMPETITION_ADCC_PARTIAL = 'ADCC Irish Open Champi';
