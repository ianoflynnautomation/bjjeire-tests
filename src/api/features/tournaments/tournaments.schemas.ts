import { z } from 'zod';
import { openApiPageSchema } from '@api/support';

export type TournamentSummary = Readonly<{ id: string }>;

// Placeholder until the contract publishes the tournament DTO: it checks the page envelope and that
// every item has an id. Replace it with the generated page schema, as the other features use.
export const tournamentsPageSchema = openApiPageSchema<TournamentSummary>(
  z.object({ data: z.array(z.object({ id: z.string() })) }),
);

export type CompetitorListDivision = Readonly<{
  divisionId: string;
  competitors: readonly Readonly<Record<string, unknown>>[];
}>;

// Placeholder until the contract publishes the competitor-list DTO. The public list is a bare array,
// one entry per division in the tournament's order; each competitor is kept as a loose record so a spec can
// assert which fields it carries (the allowed set is name, academy and affiliation).
export const competitorListSchema = z.array(
  z.object({ divisionId: z.string(), competitors: z.array(z.record(z.string(), z.unknown())) }),
);

// The tournament detail: its id, registration state and the division ids in the tournament's order.
export const tournamentDivisionsSchema = z.object({
  id: z.string(),
  registrationState: z.string(),
  divisions: z.array(z.object({ id: z.string() })),
});
