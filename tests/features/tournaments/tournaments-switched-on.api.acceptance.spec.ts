// spec: specs/features/tournaments.md
import { test, expect } from '@api/fixtures';
import {
  getTournamentCompetitors,
  getTournamentDivisions,
  getTournaments,
  requestStripeWebhook,
  requestTournamentBySlug,
  requestTournamentCompetitors,
  requestTournaments,
} from '@api/features/tournaments/tournaments.service';
import { tournamentsPageSchema } from '@api/features/tournaments/tournaments.schemas';
import { API_ROUTES, expectProblem, ProblemType, resourcePath, ValidationErrorCode } from '@api/support';
import { squash } from '@squash/annotations';
import {
  INVALID_INTEGER_QUERY_VALUES,
  OUT_OF_RANGE_PAGING_VALUES,
  UNPUBLISHED_OBJECT_ID,
} from '../common/testdata/invalid-values';
import { tournamentsSwitchedOnGiven } from './tournaments-switched-on';

// The visitor-facing and organiser routes answer anonymous callers; every request here carries no token.
// This file needs the API to serve tournaments. The switched-off scenario is in
// tournaments.api.acceptance.spec.ts; the @tournaments-on / @tournaments-off tags (TOURNAMENTS_FLAG) select one.
test.use({
  requestAuth: 'none',
});

// What the app's public competitor DTO may carry (name, academy, affiliation). The forbidden fields are the
// private ones the app's PublicCompetitorListIT checks: contact, identity and payment data.
const ALLOWED_COMPETITOR_FIELDS = ['displayName', 'academy', 'affiliation'];
const PRIVATE_COMPETITOR_FIELDS = [
  'email',
  'dateOfBirth',
  'phone',
  'address',
  'nationality',
  'competitorId',
  'payment',
  'checkout',
  'registrationId',
];

// The competitor list takes an object id: the address name is malformed (400), an unknown id is not found (404).
const COMPETITOR_LIST_ADDRESSES = [
  {
    label: 'the address name of a tournament that exists',
    address: 'acceptance-open',
    status: 400,
    problem: ProblemType.Validation,
    errors: [{ field: 'Id', errorCode: ValidationErrorCode.InvalidFormat }],
  },
  {
    label: 'an id that exists nowhere',
    address: UNPUBLISHED_OBJECT_ID,
    status: 404,
    problem: ProblemType.NotFound,
    errors: [],
  },
] as const;

// Sign-up routes. Every id is well formed and exists nowhere, and no request carries a token or a body, so a
// regression that skipped authentication still could not take a place on a seeded tournament.
const SIGN_UP_ROUTES = [
  {
    route: 'the eligible divisions',
    method: 'GET',
    path: `${resourcePath(API_ROUTES.tournaments, UNPUBLISHED_OBJECT_ID)}/eligible-division`,
  },
  { route: 'a new sign-up', method: 'POST', path: API_ROUTES.registrations },
  {
    route: 'a return to payment',
    method: 'POST',
    path: `${resourcePath(API_ROUTES.registrations, UNPUBLISHED_OBJECT_ID)}/checkout`,
  },
] as const;

// The webhook path serves only the signed POST, which a test must never send.
const UNMAPPED_WEBHOOK_METHODS = ['GET', 'PUT', 'DELETE'] as const;

const SEEDED_DIVISION_COUNT = 5;
const OVER_LONG_SLUG_LENGTH = 300;

// Not-found addresses. An address holding an encoded slash is refused by the server (400) before the
// app sees it; that row is unspecified and recorded as a finding in specs/features/tournaments.md.
const UNKNOWN_ADDRESSES = [
  { label: 'an unknown name', slug: 'does-not-exist' },
  { label: 'a name with capitals and a space', slug: 'Not A Slug' },
  { label: 'an over-long name', slug: 'a'.repeat(OVER_LONG_SLUG_LENGTH) },
] as const;

// Page and page size outside their bounds are validation errors on the field; a non-numeric size is a bad request.
const REFUSED_PAGING = [
  ...OUT_OF_RANGE_PAGING_VALUES.map(({ param, field, value }) => ({
    label: `${param === 'page' ? 'page' : 'page size'} ${value}`,
    params: { [param]: value },
    problem: ProblemType.Validation,
    errors: [{ field, errorCode: ValidationErrorCode.ValueOutOfRange }],
  })),
  ...INVALID_INTEGER_QUERY_VALUES.map(value => ({
    label: `page size "${value}"`,
    params: { pageSize: value },
    problem: ProblemType.BadRequest,
    errors: [],
  })),
];

// Organiser routes. The id is well formed and exists nowhere; no body is sent, so a refusal can only be
// about the missing token and never about the content.
const ORGANISER_ROUTES = [
  { route: 'the organiser list', method: 'GET', path: resourcePath(API_ROUTES.tournaments, 'admin') },
  {
    route: 'an organiser read',
    method: 'GET',
    path: resourcePath(resourcePath(API_ROUTES.tournaments, 'admin'), UNPUBLISHED_OBJECT_ID),
  },
  { route: 'a new tournament', method: 'POST', path: API_ROUTES.tournaments },
  { route: 'an update', method: 'PUT', path: resourcePath(API_ROUTES.tournaments, UNPUBLISHED_OBJECT_ID) },
  {
    route: 'a publish',
    method: 'POST',
    path: `${resourcePath(API_ROUTES.tournaments, UNPUBLISHED_OBJECT_ID)}/publish`,
  },
] as const;

// Competitor routes. Only the refusal is under test: no request sends a body, and
// with no token neither reaches the app's handler, so nothing is changed.
const COMPETITOR_ROUTES = [
  { route: "the competitor's own profile", method: 'GET', path: API_ROUTES.competitorMe },
  { route: 'a profile save', method: 'PUT', path: API_ROUTES.competitorMe },
  { route: 'a profile deletion', method: 'DELETE', path: API_ROUTES.competitorMe },
  { route: "the competitor's history", method: 'GET', path: `${API_ROUTES.competitorMe}/history` },
  { route: "the competitor's registrations", method: 'GET', path: API_ROUTES.registrationMe },
] as const;

test.describe(
  'Tournaments API acceptance (switched on)',
  { tag: ['@tournaments', '@tournaments-on', '@api', '@squash'] },
  () => {
    const givenTournamentsSwitchedOn = tournamentsSwitchedOnGiven();

    for (const { label, slug } of UNKNOWN_ADDRESSES) {
      test(
        `client should get not found for a tournament that does not exist when the address is ${label}`,
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
          await test.step('Given the environment has tournaments switched on', givenTournamentsSwitchedOn);

          const response = await test.step(`When a client with no token requests a tournament by ${label}`, () =>
            requestTournamentBySlug(request, slug));

          await test.step('Then the response is a not-found problem document', async () => {
            await expectProblem(response, 404, ProblemType.NotFound);
          });
        },
      );
    }

    for (const { label, params, problem, errors } of REFUSED_PAGING) {
      test(
        `client should be refused a tournament list request with an out-of-range or malformed paging value (${label})`,
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
          await test.step('Given the environment has tournaments switched on', givenTournamentsSwitchedOn);

          const response = await test.step(`When a client with no token lists the tournaments with ${label}`, () =>
            requestTournaments(request, params));

          await test.step('Then the response is a bad-request or validation problem document', async () => {
            const body = await expectProblem(response, 400, problem);
            expect(body.errors ?? []).toEqual(
              expect.arrayContaining(errors.map(error => expect.objectContaining(error))),
            );
          });
        },
      );
    }

    test(
      'client should get consecutive tournaments on consecutive pages when paging one at a time',
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
        await test.step('Given the environment has tournaments switched on', givenTournamentsSwitchedOn);

        const first = await test.step('When a client with no token lists the tournaments one per page, page 1', () =>
          getTournaments(request, tournamentsPageSchema, { page: 1, pageSize: 1 }));

        const second = await test.step('And the client requests the second page', () =>
          getTournaments(request, tournamentsPageSchema, { page: 2, pageSize: 1 }));

        const firstTwo = await test.step('And the client lists the first two tournaments on one page', () =>
          getTournaments(request, tournamentsPageSchema, { page: 1, pageSize: 2 }));

        await test.step('Then each page holds exactly one tournament', () => {
          expect(first.data).toHaveLength(1);
          expect(second.data).toHaveLength(1);
        });

        await test.step('And the two pages hold different tournaments', () => {
          expect(second.data[0]?.id).not.toBe(first.data[0]?.id);
        });

        await test.step('And both report the same total', () => {
          expect(second.pagination.totalItems).toBe(first.pagination.totalItems);
        });

        await test.step('And the second page reports a previous page and the first does not', () => {
          expect(first.pagination.hasPreviousPage).toBe(false);
          expect(second.pagination.hasPreviousPage).toBe(true);
        });

        await test.step('And together they match the first page of two', () => {
          expect(firstTwo.data.map(({ id }) => id)).toEqual([first.data[0]?.id, second.data[0]?.id]);
        });
      },
    );

    test(
      'client should list every division of a tournament in order with no competitor private data when asking for its competitors',
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
        const tournament = await test.step('Given the environment has tournaments switched on', async () => {
          givenTournamentsSwitchedOn();
          return getTournamentDivisions(request, 'acceptance-open');
        });

        const lists = await test.step('When a client with no token requests the competitors of "acceptance-open"', () =>
          getTournamentCompetitors(request, tournament.id));

        await test.step("Then the five seeded divisions are listed in the tournament's order", () => {
          expect(tournament.divisions).toHaveLength(SEEDED_DIVISION_COUNT);
          expect(lists.map(({ divisionId }) => divisionId)).toEqual(tournament.divisions.map(({ id }) => id));
        });

        await test.step('And any listed competitor carries only a name, an academy and an affiliation', () => {
          const competitors = lists.flatMap(({ competitors: listed }) => listed);
          // The seed holds no confirmed sign-ups (T079), so on a fresh stack this check has nothing to look at.
          if (competitors.length === 0)
            test.info().annotations.push({
              type: 'vacuous',
              description: 'no confirmed competitors on this stack (T079)',
            });
          for (const competitor of competitors) {
            for (const field of PRIVATE_COMPETITOR_FIELDS) expect(competitor).not.toHaveProperty(field);
            for (const field of Object.keys(competitor)) expect(ALLOWED_COMPETITOR_FIELDS).toContain(field);
          }
        });
      },
    );

    for (const { label, address, status, problem, errors } of COMPETITOR_LIST_ADDRESSES) {
      test(
        `client should get not found or bad request when asking for the competitors of a tournament at ${label}`,
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
          await test.step('Given the environment has tournaments switched on', givenTournamentsSwitchedOn);

          const response =
            await test.step(`When a client with no token requests the competitors of a tournament at ${label}`, () =>
              requestTournamentCompetitors(request, address));

          await test.step('Then the response is a problem document of the matching type', async () => {
            const body = await expectProblem(response, status, problem);
            expect(body.errors ?? []).toEqual(
              expect.arrayContaining(errors.map(error => expect.objectContaining(error))),
            );
          });
        },
      );
    }

    for (const method of UNMAPPED_WEBHOOK_METHODS) {
      test(
        `client should be refused the Stripe webhook when requesting it with ${method}`,
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
          await test.step('Given the environment has tournaments switched on', givenTournamentsSwitchedOn);

          const response =
            await test.step(`When a client with no token requests the Stripe webhook with ${method}`, () =>
              requestStripeWebhook(request, method));

          await test.step('Then the response is a method-not-allowed problem document', async () => {
            await expectProblem(response, 405, ProblemType.MethodNotAllowed);
          });
        },
      );
    }

    for (const { route, method, path } of ORGANISER_ROUTES) {
      test(
        `client should be refused the organiser tournament routes without a token when requesting ${route}`,
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
          await test.step('Given the environment has tournaments switched on', givenTournamentsSwitchedOn);

          const response = await test.step(`When a client with no token requests ${route}`, () =>
            request.fetch(path, { method }));

          await test.step('Then the response is an unauthorised problem document', async () => {
            await expectProblem(response, 401, ProblemType.Unauthorized);
          });
        },
      );
    }

    for (const { route, method, path } of COMPETITOR_ROUTES) {
      test(
        `client should be refused the competitor routes without a token when requesting ${route}`,
        {
          tag: '@acceptance',
          annotation: squash({
            weight: 'medium',
            status: 'work in progress',
            nature: 'functional',
            type: 'regression',
          }),
        },
        async ({ request, extraHTTPHeaders }) => {
          await test.step('Given the environment has tournaments switched on', () => {
            givenTournamentsSwitchedOn();
            // The deletion would remove a real profile if a token were attached, so prove the context holds none.
            expect(Object.keys(extraHTTPHeaders ?? {}).map(name => name.toLowerCase())).not.toContain('authorization');
          });

          const response = await test.step(`When a client with no token requests ${route}`, () =>
            request.fetch(path, { method }));

          await test.step('Then the response is an unauthorised problem document', async () => {
            await expectProblem(response, 401, ProblemType.Unauthorized);
          });
        },
      );
    }

    for (const { route, method, path } of SIGN_UP_ROUTES) {
      test(
        `client should be refused the sign-up routes without a token when requesting ${route}`,
        {
          tag: '@acceptance',
          annotation: squash({
            weight: 'medium',
            status: 'work in progress',
            nature: 'functional',
            type: 'regression',
          }),
        },
        async ({ request, extraHTTPHeaders }) => {
          await test.step('Given the environment has tournaments switched on', () => {
            givenTournamentsSwitchedOn();
            // A token would let the sign-up start a hold, so prove the context holds none.
            expect(Object.keys(extraHTTPHeaders ?? {}).map(name => name.toLowerCase())).not.toContain('authorization');
          });

          const response = await test.step(`When a client with no token requests ${route}`, () =>
            request.fetch(path, { method }));

          await test.step('Then the response is an unauthorised problem document', async () => {
            await expectProblem(response, 401, ProblemType.Unauthorized);
          });
        },
      );
    }
  },
);
