// spec: specs/features/competitions.md
// seed: tests/agents/seed.spec.ts
import { test, expect } from '@api/fixtures';
import { bjjEireCompetitionsPageSchema } from '@api/features/competitions/bjjeire-competitions.schemas';
import { getBjjEireCompetitions } from '@api/features/competitions/bjjeire-competitions.service';
import {
  API_ROUTES,
  expectListingPage,
  expectPagesAreDistinct,
  expectProblem,
  expectRelativeOrder,
  ProblemType,
  ValidationErrorCode,
} from '@api/support';
import { INVALID_INTEGER_QUERY_VALUES, OUT_OF_RANGE_PAGING_VALUES } from '../common/testdata/invalid-values';
import { SEEDED_FINISHED_COMPETITION, SEEDED_UPCOMING_BJJEIRE_COMPETITIONS } from './seeded';
import { squash } from '@squash/annotations';

const FULL_PAGE_SIZE = 100;
const SLICE_PAGE_SIZE = 2;

test.describe(
  'BJJ Éire competitions API acceptance',
  { tag: ['@competitions', '@bjjeire-competitions-on', '@api', '@squash'] },
  () => {
    test(
      'client should receive upcoming BJJ Éire competitions, earliest day first, and not the finished one',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ request }) => {
        const listing = await test.step('When a client requests the BJJ Éire competitions listing', () =>
          getBjjEireCompetitions(request, bjjEireCompetitionsPageSchema, { page: 1, pageSize: FULL_PAGE_SIZE }));

        const { data } = listing;

        await test.step('Then Acceptance Open, Acceptance Opens Later and Acceptance Closed are listed in that order', () => {
          expectRelativeOrder(
            data,
            competition => competition.slug,
            SEEDED_UPCOMING_BJJEIRE_COMPETITIONS.map(seeded => seeded.slug),
          );
        });

        await test.step('And each carries its day, venue, fee in euro cents, registration state and division count', () => {
          for (const seeded of SEEDED_UPCOMING_BJJEIRE_COMPETITIONS) {
            const listed = data.find(competition => competition.slug === seeded.slug);
            expect(listed, `${seeded.name} is listed`).toMatchObject({
              name: seeded.name,
              date: seeded.date,
              venue: { venue: seeded.venue },
              entryFeeCents: seeded.entryFeeCents,
              currency: seeded.currency,
              divisionCount: seeded.divisionCount,
            });
            expect(listed?.registrationState, `${seeded.name} registration state`).toEqual(
              seeded.registrationStateRolls
                ? expect.stringMatching(/^(NOT_OPEN|OPEN|FULL|CLOSED)$/)
                : seeded.registrationState,
            );
          }
        });

        await test.step('And Acceptance Finished is not listed', () => {
          expect(data.map(competition => competition.slug)).not.toContain(SEEDED_FINISHED_COMPETITION.slug);
        });

        await test.step('And no further page follows', () => {
          expect(listing.pagination.hasNextPage).toBe(false);
        });
      },
    );

    test(
      'client should page through BJJ Éire competitions in distinct slices with correct links',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ request }) => {
        const { firstPage, secondPage } =
          await test.step('When a client requests the first and second page of the BJJ Éire competitions listing with a page size of two', async () => ({
            firstPage: await getBjjEireCompetitions(request, bjjEireCompetitionsPageSchema, {
              page: 1,
              pageSize: SLICE_PAGE_SIZE,
            }),
            secondPage: await getBjjEireCompetitions(request, bjjEireCompetitionsPageSchema, {
              page: 2,
              pageSize: SLICE_PAGE_SIZE,
            }),
          }));

        const { firstSingle, secondSingle } =
          await test.step('And the client requests the first and second page with a page size of one', async () => ({
            firstSingle: await getBjjEireCompetitions(request, bjjEireCompetitionsPageSchema, { page: 1, pageSize: 1 }),
            secondSingle: await getBjjEireCompetitions(request, bjjEireCompetitionsPageSchema, {
              page: 2,
              pageSize: 1,
            }),
          }));

        await test.step('Then the two pages share no competition and the seeded data spans more than one page', () => {
          expect(firstPage.pagination.totalItems, 'seeded data must span more than one page').toBeGreaterThan(
            SLICE_PAGE_SIZE,
          );
          expectPagesAreDistinct(firstPage, secondPage, competition => competition.slug);
        });

        await test.step('And the first page has a next link and no previous link', () => {
          expectListingPage(firstPage, 1, SLICE_PAGE_SIZE);
        });

        await test.step('And the second page has a previous link that leads back to the first', () => {
          expectListingPage(secondPage, 2, SLICE_PAGE_SIZE);
        });

        await test.step('And one at a time the first two pages hold the first page of two, in the same order', () => {
          // Catches a skipped or repeated competition at a page boundary, which distinct slices alone would not.
          expect([...firstSingle.data, ...secondSingle.data].map(competition => competition.slug)).toEqual(
            firstPage.data.map(competition => competition.slug),
          );
        });
      },
    );

    const malformed = (['page', 'pageSize'] as const).flatMap(param =>
      INVALID_INTEGER_QUERY_VALUES.map(value => ({ param, value })),
    );
    for (const { param, value } of malformed) {
      test(
        `client should get a bad request for paging ${param} "${value}" that is not a number`,
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
            await test.step(`When a client requests the BJJ Éire competitions listing with ${param} set to "${value}"`, () =>
              request.get(API_ROUTES.bjjEireCompetitions, { params: { [param]: value } }));

          await test.step('Then the answer is a bad request problem', async () => {
            await expectProblem(response, 400, ProblemType.BadRequest);
          });
        },
      );
    }

    for (const { param, field, value } of OUT_OF_RANGE_PAGING_VALUES) {
      test(
        `client should get a bad request for paging ${param} "${value}" on the BJJ Éire competitions listing`,
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
            await test.step(`When a client requests the BJJ Éire competitions listing with ${param} set to "${value}"`, () =>
              request.get(API_ROUTES.bjjEireCompetitions, { params: { [param]: value } }));

          await test.step('Then the answer is a bad request problem that names the field', async () => {
            const problem = await expectProblem(response, 400, ProblemType.Validation);
            expect(problem.errors).toContainEqual(
              expect.objectContaining({ field, errorCode: ValidationErrorCode.ValueOutOfRange }),
            );
          });
        },
      );
    }
  },
);
