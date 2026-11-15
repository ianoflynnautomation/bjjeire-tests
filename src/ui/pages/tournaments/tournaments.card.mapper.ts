import { REGISTRATION_STATE_LABELS } from './tournaments.constants';
import type { SeededTournamentFacts, TournamentCard } from './tournaments.types';

export type ExpectedTournamentCard = {
  [K in 'name' | 'state' | 'venue' | 'fee' | 'divisionCount' | 'date']-?: NonNullable<TournamentCard[K]>;
};

/** Euro cents as the visitor reads them: 2500 -> "€25.00". Rendered here, not by the app's formatter. */
function euroFromCents(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

/** `2035-06-02` -> "2 June 2035". Kept here because src/ does not import from tests/ (tests/.../dublin-time.ts has the same rule). */
function longDayFromIso(day: string): string {
  const instant = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(instant.getTime())) throw new Error(`Not a day: '${day}'`);
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' }).format(
    instant,
  );
}

/** "1 division" / "5 divisions", as the visitor reads the card. */
function divisionsLabel(count: number): string {
  return `${count} ${count === 1 ? 'division' : 'divisions'}`;
}

export function tournamentCardFromSeeded(tournament: SeededTournamentFacts): ExpectedTournamentCard {
  return {
    name: tournament.name,
    state: REGISTRATION_STATE_LABELS[tournament.registrationState],
    venue: tournament.venue,
    date: longDayFromIso(tournament.day),
    fee: euroFromCents(tournament.entryFeeCents),
    divisionCount: divisionsLabel(tournament.divisionCount),
  };
}
