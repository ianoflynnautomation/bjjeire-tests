import { partialNameOf } from '../common/testdata/seeded/partial-name';
import type { SeededTournamentFacts } from '@ui/pages/tournaments/tournaments.types';

// From the app's test dataset (`bjjeire-java/seeder/data-test/tournaments/`). Registration windows move
// with the seed run, so only the state the seed implies is recorded, never a date.
// `acceptance-closed` has its own day, venue and fee so a card showing another tournament's values is caught.
export const SEEDED_TOURNAMENT_OPEN: SeededTournamentFacts = {
  slug: 'acceptance-open',
  day: '2035-06-02',
  name: 'Acceptance Open',
  venue: 'National Indoor Arena',
  entryFeeCents: 2500,
  divisionCount: 5,
  registrationState: 'OPEN',
};

export const SEEDED_TOURNAMENT_OPENS_LATER: SeededTournamentFacts = {
  slug: 'acceptance-opens-later',
  day: '2035-06-02',
  name: 'Acceptance Opens Later',
  venue: 'National Indoor Arena',
  entryFeeCents: 2500,
  divisionCount: 5,
  registrationState: 'NOT_OPEN',
};

export const SEEDED_TOURNAMENT_CLOSED: SeededTournamentFacts = {
  slug: 'acceptance-closed',
  day: '2035-07-14',
  name: 'Acceptance Closed',
  venue: 'UL Sport Arena',
  entryFeeCents: 3000,
  divisionCount: 5,
  registrationState: 'CLOSED',
};

export const SEEDED_TOURNAMENT_CLOSED_PARTIAL_NAME = partialNameOf(SEEDED_TOURNAMENT_CLOSED, 'Acceptance Closed');

/** `acceptance-open`'s five divisions by discipline and gender, from the seed file. */
export const SEEDED_TOURNAMENT_OPEN_DIVISION_GROUPS = [
  { label: 'Gi · Male', rows: 2 },
  { label: 'Gi · Female', rows: 1 },
  { label: 'No-Gi · Male', rows: 1 },
  { label: 'No-Gi · Female', rows: 1 },
] as const;

export const SEEDED_TOURNAMENTS: readonly SeededTournamentFacts[] = [
  SEEDED_TOURNAMENT_OPEN,
  SEEDED_TOURNAMENT_OPENS_LATER,
  SEEDED_TOURNAMENT_CLOSED,
];

/** The seeded tournaments a name search for `term` lists: the list search is a case-insensitive substring match. */
export function seededTournamentsMatching(term: string): readonly SeededTournamentFacts[] {
  return SEEDED_TOURNAMENTS.filter(tournament => tournament.name.toLowerCase().includes(term.toLowerCase()));
}

/** A search term no seeded name contains. */
export const NO_MATCH_SEARCH_TERM = 'zzzz-no-such-tournament';
if (seededTournamentsMatching(NO_MATCH_SEARCH_TERM).length > 0) {
  throw new Error(`'${NO_MATCH_SEARCH_TERM}' now matches a seeded tournament — choose another term.`);
}
