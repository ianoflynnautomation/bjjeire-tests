import { z } from 'zod';
import { openApiPageSchema } from '@api/support';

export type TournamentSummary = Readonly<{ id: string }>;

// Placeholder until the contract publishes the tournament DTO: it checks the page envelope and that
// every item has an id. Replace it with the generated page schema, as the other features use.
export const tournamentsPageSchema = openApiPageSchema<TournamentSummary>(
  z.object({ data: z.array(z.object({ id: z.string() })) }),
);
