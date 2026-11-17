// spec: specs/features/competitions.md
// seed: tests/agents/seed.spec.ts
import { test, expect } from '@api/fixtures';
import {
  bjjEireCompetitionSchema,
  bjjEireDivisionCompetitorsSchema,
  bjjEireLeaderboardSchema,
} from '@api/features/competitions/bjjeire-competitions.schemas';
import {
  getBjjEireCompetitionBySlug,
  getBjjEireCompetitors,
  getBjjEireLeaderboard,
} from '@api/features/competitions/bjjeire-competitions.service';
import { API_ROUTES, expectProblem, ProblemType, resourcePath, ValidationErrorCode } from '@api/support';
import { INVALID_OBJECT_ID_VALUES, UNPUBLISHED_OBJECT_ID } from '../common/testdata/invalid-values';
import {
  SEEDED_FINISHED_COMPETITION_DETAIL,
  SEEDED_FINISHED_COMPETITORS_BY_DIVISION,
  SEEDED_FINISHED_LEADERBOARD,
  SEEDED_OPEN_COMPETITION_ID,
  SEEDED_OPEN_DIVISION_IDS,
} from './seeded';
import { squash } from '@squash/annotations';

const { divisions: SEEDED_DIVISIONS, venue: SEEDED_VENUE, ...SEEDED_DETAILS } = SEEDED_FINISHED_COMPETITION_DETAIL;

// Names no competition has. Only this test uses the set, so it stays inline. The unsafe ones
// (a space, markup, a query injection attempt) are sent encoded by `resourcePath`.
/** Longer than any real address name; answered 404 like any unknown one (observed 2026-11-17). */
const OVER_LONG_NAME_LENGTH = 300;

const UNKNOWN_ADDRESS_NAMES = [
  { description: 'an unknown name', value: 'no-such-competition' },
  { description: 'a name with a space', value: 'no such competition' },
  { description: 'markup', value: '<script>' },
  { description: 'a query injection attempt', value: '1 OR 1=1' },
  // Address-name lookup is case-sensitive by design: a seeded name in other capitals is an unknown address.
  { description: 'a seeded name with capitals', value: 'Acceptance-Open' },
  { description: 'an over-long name', value: 'a'.repeat(OVER_LONG_NAME_LENGTH) },
] as const;

test.describe(
  'BJJ Éire competition detail API acceptance',
  { tag: ['@competitions', '@bjjeire-competitions-on', '@api', '@squash'] },
  () => {
    test(
      'client should receive a competition by its address name with its details and divisions',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ request }) => {
        const competition =
          await test.step('When a client requests the competition with the address name "acceptance-finished"', () =>
            getBjjEireCompetitionBySlug(request, bjjEireCompetitionSchema, SEEDED_DETAILS.slug));

        await test.step('Then it is returned with its name, day, venue, fee, limit and places taken', () => {
          expect(competition).toMatchObject({
            id: SEEDED_DETAILS.id,
            slug: SEEDED_DETAILS.slug,
            name: SEEDED_DETAILS.name,
            date: SEEDED_DETAILS.date,
            venue: { venue: SEEDED_VENUE },
            entryFeeCents: SEEDED_DETAILS.entryFeeCents,
            currency: SEEDED_DETAILS.currency,
            competitorLimit: SEEDED_DETAILS.competitorLimit,
            placesTaken: SEEDED_DETAILS.placesTaken,
          });
        });

        await test.step('And its status is finished and its registration is closed', () => {
          expect(competition.status).toBe(SEEDED_DETAILS.status);
          expect(competition.registrationState).toBe(SEEDED_DETAILS.registrationState);
        });

        await test.step('And its five divisions are listed in the order above', () => {
          expect(competition.divisions).toHaveLength(SEEDED_DIVISIONS.length);
          expect(competition.divisions).toMatchObject([...SEEDED_DIVISIONS]);
        });
      },
    );

    test(
      "client should receive each division's confirmed competitors with academy and affiliation and nothing private",
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'high', status: 'work in progress', nature: 'security', type: 'regression' }),
      },
      async ({ request }) => {
        const divisions =
          await test.step('When a client requests the competitors of the competition "Acceptance Finished"', () =>
            getBjjEireCompetitors(request, bjjEireDivisionCompetitorsSchema, SEEDED_DETAILS.id));

        await test.step("Then the divisions are listed in the competition's order", () => {
          // Compared as returned, not sorted: the page lists the divisions in this order.
          expect(divisions.map(division => division.divisionId)).toEqual(SEEDED_DIVISIONS.map(division => division.id));
        });

        await test.step('And each division lists the seeded competitors by display name', () => {
          const byDivision = Object.fromEntries(divisions.map(division => [division.divisionId, division.competitors]));
          for (const [divisionId, expected] of Object.entries(SEEDED_FINISHED_COMPETITORS_BY_DIVISION)) {
            expect(byDivision[divisionId]?.map(c => c.displayName).sort()).toEqual(
              expected.map(c => c.displayName).sort(),
            );
          }
          const total = divisions.reduce((sum, division) => sum + division.competitors.length, 0);
          expect(total).toBe(SEEDED_DETAILS.placesTaken);
        });

        await test.step('And a competitor with no academy carries none', () => {
          const darragh = divisions.flatMap(d => d.competitors).find(c => c.displayName === 'Darragh Kelly');
          expect(darragh).toBeDefined();
          expect(darragh?.academy ?? null).toBeNull();
          expect(darragh?.affiliation ?? null).toBeNull();
        });

        await test.step('And no entry carries anything beyond name, academy and affiliation', () => {
          // Strict: exactly the seeded keys and values per entry, so any extra field (email, date of birth, id) fails.
          for (const division of divisions) {
            const expected = SEEDED_FINISHED_COMPETITORS_BY_DIVISION[division.divisionId] ?? [];
            const byName = (a: { displayName: string }, b: { displayName: string }) =>
              a.displayName.localeCompare(b.displayName);
            expect([...division.competitors].sort(byName)).toStrictEqual([...expected].sort(byName));
            expect(Object.keys(division).sort()).toEqual(['competitors', 'divisionId']);
          }
        });
      },
    );

    test(
      'client should receive every division of a competition with no confirmed competitors as an empty list',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ request }) => {
        const divisions =
          await test.step('When a client requests the competitors of the competition "Acceptance Open"', () =>
            getBjjEireCompetitors(request, bjjEireDivisionCompetitorsSchema, SEEDED_OPEN_COMPETITION_ID));

        await test.step("Then each of its five divisions is listed in the competition's order", () => {
          expect(divisions.map(division => division.divisionId)).toEqual([...SEEDED_OPEN_DIVISION_IDS]);
        });

        await test.step('And every division lists no competitor', () => {
          for (const division of divisions) {
            expect(division.competitors, `division ${division.divisionId}`).toEqual([]);
          }
        });
      },
    );

    test(
      'client should receive the academy and affiliation rankings and winners of a finished competition',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ request }) => {
        const leaderboard =
          await test.step('When a client requests the leaderboard of the competition "Acceptance Finished"', () =>
            getBjjEireLeaderboard(request, bjjEireLeaderboardSchema, SEEDED_DETAILS.id));

        await test.step('Then the academies are ranked 1 to 4 with those points and medal counts', () => {
          expect(leaderboard.academyRanking).toStrictEqual([...SEEDED_FINISHED_LEADERBOARD.academyRanking]);
        });

        await test.step('And the affiliations are ranked 1 and 2 with those points and medal counts', () => {
          expect(leaderboard.affiliationRanking).toStrictEqual([...SEEDED_FINISHED_LEADERBOARD.affiliationRanking]);
        });

        await test.step('And the winners are Lee Valley Jiu-Jitsu and Atlantic Alliance', () => {
          expect(leaderboard.winners).toStrictEqual({
            academies: [...SEEDED_FINISHED_LEADERBOARD.winners.academies],
            affiliations: [...SEEDED_FINISHED_LEADERBOARD.winners.affiliations],
          });
        });

        await test.step('And the division with one competitor awards no points while the other four do', () => {
          expect(leaderboard.podiums.map(p => [p.divisionId, p.pointsAwarded])).toStrictEqual(
            SEEDED_FINISHED_LEADERBOARD.pointsAwardedByDivision.map(([id, awarded]) => [id, awarded]),
          );
        });
      },
    );

    test(
      'client should receive an empty leaderboard before any result is recorded',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ request }) => {
        const leaderboard =
          await test.step('When a client requests the leaderboard of the competition "Acceptance Open"', () =>
            getBjjEireLeaderboard(request, bjjEireLeaderboardSchema, SEEDED_OPEN_COMPETITION_ID));

        await test.step('Then it has no podiums and no rankings', () => {
          expect(leaderboard.podiums).toStrictEqual([]);
          expect(leaderboard.academyRanking).toStrictEqual([]);
          expect(leaderboard.affiliationRanking).toStrictEqual([]);
        });

        await test.step('And it names no winners', () => {
          // The contract gives winners only once FINISHED, so the key is absent, not null.
          expect(leaderboard).not.toHaveProperty('winners');
        });
      },
    );

    for (const { description, value } of UNKNOWN_ADDRESS_NAMES) {
      test(
        `client should get not found for a competition address name that is ${description}`,
        {
          tag: '@acceptance',
          annotation: squash({
            weight: 'medium',
            status: 'work in progress',
            nature: 'functional',
            type: 'regression',
          }),
        },
        async ({ request }) => {
          const response =
            await test.step(`When a client requests the competition with an address name that is ${description}`, () =>
              request.get(resourcePath(API_ROUTES.bjjEireCompetitions, value)));

          await test.step('Then the answer is not found as a problem document', async () => {
            await expectProblem(response, 404, ProblemType.NotFound);
          });
        },
      );
    }

    test(
      'client should get not found for the leaderboard of an unknown competition',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ request }) => {
        const response =
          await test.step('When a client requests the leaderboard of a competition that does not exist', () =>
            request.get(`${resourcePath(API_ROUTES.bjjEireCompetitions, UNPUBLISHED_OBJECT_ID)}/leaderboard`));

        await test.step('Then the answer is not found as a problem document', async () => {
          await expectProblem(response, 404, ProblemType.NotFound);
        });
      },
    );

    for (const { description, value } of INVALID_OBJECT_ID_VALUES) {
      test(
        `client should get a bad request for the leaderboard at ${description}`,
        {
          tag: '@acceptance',
          annotation: squash({
            weight: 'medium',
            status: 'work in progress',
            nature: 'functional',
            type: 'regression',
          }),
        },
        async ({ request }) => {
          const response =
            await test.step(`When a client requests the leaderboard of the competition at ${description}`, () =>
              request.get(`${resourcePath(API_ROUTES.bjjEireCompetitions, value)}/leaderboard`));

          await test.step('Then the answer is a bad request problem document that names the malformed id', async () => {
            const problem = await expectProblem(response, 400, ProblemType.Validation);
            expect(problem.errors).toContainEqual(
              expect.objectContaining({ field: 'Id', errorCode: ValidationErrorCode.InvalidFormat }),
            );
          });
        },
      );
    }
  },
);
