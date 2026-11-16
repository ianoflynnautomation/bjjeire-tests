export type TournamentCard = Readonly<{
  name: string;
  state: string | null;
  date: string | null;
  venue: string | null;
  fee: string | null;
  divisionCount: string | null;
}>;

/** The facts of a seeded tournament the list card shows, as the seed file states them. */
export type SeededTournamentFacts = Readonly<{
  slug: string;
  /** The tournament day as the seed states it, `YYYY-MM-DD`. */
  day: string;
  name: string;
  venue: string;
  entryFeeCents: number;
  divisionCount: number;
  registrationState: 'OPEN' | 'CLOSED' | 'NOT_OPEN';
}>;

/** The details a competitor types into the profile form; the labels are the app's, the values are the test's. */
export type ProfileDetails = Readonly<{
  firstName: string;
  lastName: string;
  nationality: string;
  dateOfBirth: string;
  gender: string;
  belt: string;
}>;
