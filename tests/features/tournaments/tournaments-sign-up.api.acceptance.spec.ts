// spec: specs/features/tournaments.md
import type { APIRequestContext } from '@playwright/test';
import { test, expect } from './fixtures.api';
import {
  requestOwnCompetitor,
  type CompetitorProfileOptions,
  type LocalCompetitor,
} from '@api/features/tournaments/competitor.service';
import {
  getTournamentDivisions,
  requestEligibleDivisions,
  requestCheckoutResume,
  requestSignUp,
  requestSignUpBody,
  requestSignUpRaw,
} from '@api/features/tournaments/tournaments.service';
import { expectProblem, ProblemType, ValidationErrorCode } from '@api/support';
import { squash } from '@squash/annotations';
import { INVALID_OBJECT_ID_VALUES, UNPUBLISHED_OBJECT_ID } from '../common/testdata/invalid-values';
import { tournamentsSwitchedOnGiven } from './tournaments-switched-on';

// Scenarios that sign in a competitor through the stack's local sign-in (@local-sign-in). Every request is one the
// API must refuse before it takes a place, because a sign-up on a seeded tournament can never be given back.
// A complete profile that no division of the seeded tournaments accepts (no black belt is seeded), so a sign-up that
// slipped past a regressed window check still ends in not-eligible before any place is taken.
const NO_DIVISION_PROFILE: CompetitorProfileOptions = { gender: 'FEMALE', belt: 'BLACK', dateOfBirth: '1990-01-01' };

test.use({ requestAuth: 'none', competitorProfile: NO_DIVISION_PROFILE });

/** The fixture's competitor is signed in: its own profile answers. */
async function expectSignedIn(request: APIRequestContext, competitor: LocalCompetitor): Promise<void> {
  const response = await requestOwnCompetitor(request, competitor.token);
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ email: competitor.email });
}

/** The fixture's competitor is signed in and the profile was saved as asked. */
async function expectProfileSaved(
  request: APIRequestContext,
  competitor: LocalCompetitor,
  profile: CompetitorProfileOptions,
): Promise<void> {
  const response = await requestOwnCompetitor(request, competitor.token);
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({
    email: competitor.email,
    gender: profile.gender,
    belt: profile.belt,
    dateOfBirth: profile.dateOfBirth,
    profileComplete: true,
  });
}

// Seeded tournaments outside their registration window only by construction of the seed's relative dates:
// acceptance-opens-later opens at now+7d (seeder data-test/tournaments/acceptance-opens-later.json), so a week after
// the seed it is OPEN and a sign-up would take a place for good. The Given step therefore reads the state and fails
// before any request unless it is the expected one (reseed the stack). Second barrier: NO_DIVISION_PROFILE.
const CLOSED_WINDOW_TOURNAMENTS = [
  { slug: 'acceptance-opens-later', state: 'NOT_OPEN' },
  { slug: 'acceptance-closed', state: 'CLOSED' },
] as const;

// A consent is the JSON value true. `false`, null and a missing field fail validation; a string or a number is the wrong
// JSON type (a bad request). Confirmed live 2026-11-15, each field alone.
const CONSENT_VALUES = [
  {
    label: 'false',
    consent: { value: false },
    problem: ProblemType.Validation,
    errorCode: ValidationErrorCode.AssertTrue,
  },
  { label: 'the string "true"', consent: { value: 'true' }, problem: ProblemType.BadRequest, errorCode: undefined },
  { label: 'the number 1', consent: { value: 1 }, problem: ProblemType.BadRequest, errorCode: undefined },
  { label: 'null', consent: { value: null }, problem: ProblemType.Validation, errorCode: ValidationErrorCode.NotNull },
  { label: 'missing', consent: {}, problem: ProblemType.Validation, errorCode: ValidationErrorCode.NotNull },
] as const;
// A body that is not JSON must be a bad request on every route, not a server error. Each carries an id that exists
// nowhere, so nothing can be created even if the refusal regressed. Confirmed live 2026-11-15.
const NOT_JSON_BODIES = [
  { label: 'plain text', contentType: 'text/plain', body: `tournamentId=${UNPUBLISHED_OBJECT_ID}` },
  {
    label: 'XML',
    contentType: 'application/xml',
    body: `<registration><tournamentId>${UNPUBLISHED_OBJECT_ID}</tournamentId></registration>`,
  },
  {
    label: 'form-encoded',
    contentType: 'application/x-www-form-urlencoded',
    body: `tournamentId=${UNPUBLISHED_OBJECT_ID}&divisionId=${UNPUBLISHED_OBJECT_ID}&acceptPublicListing=true&acceptTerms=true`,
  },
] as const;

// An id that exists nowhere, for the tournament or for a division of acceptance-closed (outside its window, so even a
// regressed lookup could not take a place). The API looks both up before it checks the window, so neither can hold
// one (probed by hand 2026-11-15: both 404).
const MISSING_SIGN_UP_TARGETS = [
  { label: 'a tournament', tournamentExists: false },
  { label: 'a division', tournamentExists: true },
] as const;

// Sign-up ids for the payment page: one that exists nowhere (not found) and the shared malformed object ids (validation
// error on the id). None is a real sign-up, so nothing is resumed. Confirmed live 2026-11-15.
const CHECKOUT_IDS = [
  {
    kind: 'one that does not exist',
    id: UNPUBLISHED_OBJECT_ID,
    status: 404,
    problem: ProblemType.NotFound,
    errors: [],
  },
  ...INVALID_OBJECT_ID_VALUES.map(({ description, value }) => ({
    kind: `malformed as ${description}`,
    id: value,
    status: 400,
    problem: ProblemType.Validation,
    errors: [{ field: 'Id', errorCode: ValidationErrorCode.InvalidFormat }],
  })),
];

type ConsentField = 'acceptPublicListing' | 'acceptTerms';

test.describe(
  'Tournaments sign-up API acceptance (switched on)',
  { tag: ['@tournaments', '@tournaments-on', '@api', '@squash'] },
  () => {
    const givenTournamentsSwitchedOn = tournamentsSwitchedOnGiven();

    for (const { slug, state } of CLOSED_WINDOW_TOURNAMENTS) {
      test(
        `client should be offered no division when registration is not open for ${slug}`,
        {
          tag: ['@acceptance', '@local-sign-in'],
          annotation: squash({
            weight: 'medium',
            status: 'work in progress',
            nature: 'functional',
            type: 'regression',
          }),
        },
        async ({ request, competitor }) => {
          const tournament = await test.step('Given the environment has tournaments switched on', async () => {
            givenTournamentsSwitchedOn();
            const read = await getTournamentDivisions(request, slug);
            // Stop before any sign-up when the seed has aged: an open window would take a real place.
            expect(
              read.registrationState,
              `${slug} is ${read.registrationState}, expected ${state}: its relative dates have moved on, reseed the stack before running this test`,
            ).toBe(state);
            return read;
          });

          await test.step('And a competitor has signed in with a new email and saved a complete profile', () =>
            expectProfileSaved(request, competitor, NO_DIVISION_PROFILE));

          const eligible = await test.step(`When the competitor asks which divisions they may enter in ${slug}`, () =>
            requestEligibleDivisions(request, tournament.id, competitor));

          const signUp = await test.step(`And the competitor tries to sign up for a division of ${slug}`, () => {
            const [division] = tournament.divisions;
            expect(division, `${slug} has a division`).toBeDefined();
            return requestSignUp(request, { tournamentId: tournament.id, divisionId: division?.id ?? '' }, competitor);
          });

          await test.step('Then each request is refused as a registration-not-open problem document', async () => {
            await expectProblem(eligible, 409, ProblemType.RegistrationNotOpen);
            await expectProblem(signUp, 409, ProblemType.RegistrationNotOpen);
          });

          await test.step('And no payment page is returned', async () => {
            expect(await signUp.text()).not.toContain('checkoutUrl');
            expect(await eligible.text()).not.toContain('checkoutUrl');
          });
        },
      );
    }

    for (const { label, tournamentExists } of MISSING_SIGN_UP_TARGETS) {
      test(
        `client should get not found when signing up for ${label} that does not exist`,
        {
          tag: ['@acceptance', '@local-sign-in'],
          annotation: squash({
            weight: 'medium',
            status: 'work in progress',
            nature: 'functional',
            type: 'regression',
          }),
        },
        async ({ request, competitor }) => {
          const closed = await test.step('Given the environment has tournaments switched on', async () => {
            givenTournamentsSwitchedOn();
            return getTournamentDivisions(request, 'acceptance-closed');
          });

          await test.step('And a competitor has signed in with a new email and saved a complete profile', () =>
            expectProfileSaved(request, competitor, NO_DIVISION_PROFILE));

          const response = await test.step(`When the competitor signs up for ${label}`, () =>
            requestSignUp(
              request,
              tournamentExists
                ? { tournamentId: closed.id, divisionId: UNPUBLISHED_OBJECT_ID }
                : { tournamentId: UNPUBLISHED_OBJECT_ID, divisionId: closed.divisions[0]?.id ?? UNPUBLISHED_OBJECT_ID },
              competitor,
            ));

          await test.step('Then the response is a not-found problem document', async () => {
            await expectProblem(response, 404, ProblemType.NotFound);
          });
        },
      );
    }

    // No profile: the refusal comes from the body, before the competitor or the tournament is looked at.
    test.describe('without a profile', () => {
      test.use({ competitorProfile: undefined });

      for (const { label, consent, problem, errorCode } of CONSENT_VALUES) {
        test(
          `client should be refused a sign-up that does not accept both consents when the consent is ${label}`,
          {
            tag: ['@acceptance', '@local-sign-in'],
            annotation: squash({
              weight: 'medium',
              status: 'work in progress',
              nature: 'functional',
              type: 'regression',
            }),
          },
          async ({ request, competitor }) => {
            await test.step('Given the environment has tournaments switched on', givenTournamentsSwitchedOn);

            await test.step('And a competitor has signed in with a new email', () =>
              expectSignedIn(request, competitor));

            // An id that exists nowhere: the body is refused first, and a regressed rule would still end in not found.
            const send = (field: ConsentField, other: ConsentField) =>
              requestSignUpBody(
                request,
                {
                  tournamentId: UNPUBLISHED_OBJECT_ID,
                  divisionId: UNPUBLISHED_OBJECT_ID,
                  [other]: true,
                  ...('value' in consent ? { [field]: consent.value } : {}),
                },
                competitor,
              );

            const listing =
              await test.step(`When the competitor tries to sign up with the public-listing consent as ${label}`, () =>
                send('acceptPublicListing', 'acceptTerms'));

            const terms =
              await test.step(`And the competitor tries to sign up with the terms consent as ${label}`, () =>
                send('acceptTerms', 'acceptPublicListing'));

            await test.step('Then each request is refused as a bad-request or validation problem document', async () => {
              const refusals = [
                { response: listing, errorField: 'AcceptPublicListing' },
                { response: terms, errorField: 'AcceptTerms' },
              ];
              for (const { response, errorField } of refusals) {
                const body = await expectProblem(response, 400, problem);
                const expected = errorCode ? [expect.objectContaining({ field: errorField, errorCode })] : [];
                expect(body.errors ?? []).toEqual(expect.arrayContaining(expected));
              }
            });
          },
        );
      }

      for (const { label, contentType, body } of NOT_JSON_BODIES) {
        test(
          `client should be refused a sign-up request body that is not JSON when it is sent as ${label}`,
          {
            tag: ['@acceptance', '@local-sign-in'],
            annotation: squash({
              weight: 'medium',
              status: 'work in progress',
              nature: 'functional',
              type: 'regression',
            }),
          },
          async ({ request, competitor }) => {
            await test.step('Given the environment has tournaments switched on', givenTournamentsSwitchedOn);

            await test.step('And a competitor has signed in with a new email', () =>
              expectSignedIn(request, competitor));

            const response = await test.step(`When the competitor sends a sign-up whose body is ${label}`, () =>
              requestSignUpRaw(request, body, contentType, competitor));

            await test.step('Then the response is a bad-request problem document', async () => {
              await expectProblem(response, 400, ProblemType.BadRequest);
            });
          },
        );
      }

      for (const { kind, id, status, problem, errors } of CHECKOUT_IDS) {
        test(
          `client should get not found or bad request when resuming payment for a sign-up that is ${kind}`,
          {
            tag: ['@acceptance', '@local-sign-in'],
            annotation: squash({
              weight: 'medium',
              status: 'work in progress',
              nature: 'functional',
              type: 'regression',
            }),
          },
          async ({ request, competitor }) => {
            await test.step('Given the environment has tournaments switched on', givenTournamentsSwitchedOn);

            await test.step('And a competitor has signed in with a new email', () =>
              expectSignedIn(request, competitor));

            const response =
              await test.step(`When the competitor asks to return to the payment page of a sign-up that is ${kind}`, () =>
                requestCheckoutResume(request, id, competitor));

            await test.step('Then the response is a problem document of the matching type', async () => {
              const body = await expectProblem(response, status, problem);
              expect(body.errors ?? []).toEqual(
                expect.arrayContaining(errors.map(error => expect.objectContaining(error))),
              );
            });
          },
        );
      }
    });
  },
);
