import { z } from 'zod';

/**
 * CONTRACT GAP: the pulled OpenAPI contract has no `bjjeire-competition` schema (checked 2026-11-16), so
 * `src/api/generated/zod.gen.ts` has nothing to validate `GET /api/v1/bjjeire-competition` against. This hand-written
 * envelope and the fields the featured cards read stand in for it, and only validate UI mock bodies.
 * The listing client (`bjjeire-competitions.service.ts`) parses with it too, until the contract publishes it.
 * When the contract publishes the endpoint: run `npm run contract:pull` and `npm run gen:api-schemas`, switch
 * `mockBjjEireCompetitions` to the generated schema, then delete this file.
 * `bjjEireCompetitionSchema` stands in for `GET /api/v1/bjjeire-competition/{slug}` the same way; the competitors
 * body (`bjjEireDivisionCompetitorsSchema`) joins it, and the competitors and leaderboard bodies (`bjjEireLeaderboardSchema`) join it.
 */
export const bjjEireCompetitionsPageSchema = z.object({
  data: z.array(
    z
      .object({
        id: z.string(),
        slug: z.string(),
        name: z.string(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        venue: z.object({ venue: z.string() }).loose(),
        entryFeeCents: z.number(),
        currency: z.string(),
        registrationState: z.string(),
        status: z.string(),
        divisionCount: z.number(),
      })
      .loose(),
  ),
  pagination: z.object({
    totalItems: z.number(),
    currentPage: z.number(),
    pageSize: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
    nextPageUrl: z.string().nullable(),
    previousPageUrl: z.string().nullable(),
  }),
});

export type BjjEireCompetitionsPage = z.infer<typeof bjjEireCompetitionsPageSchema>;

export const bjjEireDivisionSchema = z
  .object({
    id: z.string(),
    discipline: z.string(),
    gender: z.string(),
    ageCategory: z.string(),
    belt: z.string(),
    weightClass: z.string(),
  })
  .loose();

export const bjjEireCompetitionSchema = z
  .object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    description: z.string().nullish(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    venue: z.object({ venue: z.string(), address: z.string().nullish() }).loose(),
    entryFeeCents: z.number(),
    currency: z.string(),
    registrationOpensAt: z.string().nullish(),
    registrationClosesAt: z.string().nullish(),
    competitorLimit: z.number().nullish(),
    placesTaken: z.number(),
    status: z.string(),
    registrationState: z.string(),
    divisions: z.array(bjjEireDivisionSchema),
  })
  .loose();

export type BjjEireDivision = z.infer<typeof bjjEireDivisionSchema>;
export type BjjEireCompetition = z.infer<typeof bjjEireCompetitionSchema>;

/**
 * `GET /api/v1/bjjeire-competition/{id}/competitor`: one entry per division. Loose on purpose, like the rest of this
 * stand-in: the privacy check ("nothing but name, academy and affiliation") is the spec's strict key assertion.
 * An absent academy or affiliation is left out of the body, not written as null.
 */
export const bjjEireDivisionCompetitorsSchema = z.array(
  z
    .object({
      divisionId: z.string(),
      competitors: z.array(
        z
          .object({
            displayName: z.string(),
            academy: z.string().nullish(),
            affiliation: z.string().nullish(),
          })
          .loose(),
      ),
    })
    .loose(),
);

export type BjjEireDivisionCompetitors = z.infer<typeof bjjEireDivisionCompetitorsSchema>;

const podiumPlaceSchema = z
  .object({ displayName: z.string(), academy: z.string().nullish(), affiliation: z.string().nullish() })
  .loose();

const rankingEntrySchema = z
  .object({
    rank: z.number(),
    name: z.string(),
    points: z.number(),
    gold: z.number(),
    silver: z.number(),
    bronze: z.number(),
  })
  .loose();

/**
 * `GET /api/v1/bjjeire-competition/{id}/leaderboard` (contract: `LeaderboardDto`). `winners` is absent, not null,
 * until the competition is FINISHED; a division with no silver carries no `silver` key.
 */
export const bjjEireLeaderboardSchema = z
  .object({
    podiums: z.array(
      z
        .object({
          divisionId: z.string(),
          gold: podiumPlaceSchema.nullish(),
          silver: podiumPlaceSchema.nullish(),
          bronzes: z.array(podiumPlaceSchema),
          pointsAwarded: z.boolean(),
        })
        .loose(),
    ),
    academyRanking: z.array(rankingEntrySchema),
    affiliationRanking: z.array(rankingEntrySchema),
    winners: z
      .object({ academies: z.array(z.string()), affiliations: z.array(z.string()) })
      .loose()
      .nullish(),
  })
  .loose();

export type BjjEireLeaderboard = z.infer<typeof bjjEireLeaderboardSchema>;
