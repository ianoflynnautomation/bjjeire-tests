// spec: specs/features/competitions.md
import { test, expect } from '@api/fixtures';
import {
  requestBjjEireCompetitors,
  requestStripeWebhook,
} from '@api/features/competitions/bjjeire-competitions.service';
import { API_ROUTES, expectProblem, ProblemType, resourcePath, ValidationErrorCode } from '@api/support';
import { squash } from '@squash/annotations';
import { UNPUBLISHED_OBJECT_ID } from '../common/testdata/invalid-values';
import { bjjEireCompetitionsSwitchedOnGiven } from './switched-on';

// Access rules of the BJJ Éire competition, competitor and registration routes for a caller with no token.
// This file needs the API to serve BJJ Éire competitions (@bjjeire-competitions-on, BJJEIRE_COMPETITIONS_FLAG).
// Flag-off behaviour is owned by the app's API integration tests, not this suite.
test.use({
  requestAuth: 'none',
});

// The competitor list takes an object id: the address name is malformed (400), an unknown id is not found (404).
const COMPETITOR_LIST_ADDRESSES = [
  {
    label: 'the address name of a competition that exists',
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
// regression that skipped authentication still could not take a place on a seeded competition.
const SIGN_UP_ROUTES = [
  {
    route: 'the eligible divisions',
    method: 'GET',
    path: `${resourcePath(API_ROUTES.bjjEireCompetitions, UNPUBLISHED_OBJECT_ID)}/eligible-division`,
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

// Organiser routes. The id is well formed and exists nowhere; no body is sent, so a refusal can only be
// about the missing token and never about the content.
const ORGANISER_ROUTES = [
  { route: 'the organiser list', method: 'GET', path: resourcePath(API_ROUTES.bjjEireCompetitions, 'admin') },
  {
    route: 'an organiser read',
    method: 'GET',
    path: resourcePath(resourcePath(API_ROUTES.bjjEireCompetitions, 'admin'), UNPUBLISHED_OBJECT_ID),
  },
  { route: 'a new competition', method: 'POST', path: API_ROUTES.bjjEireCompetitions },
  { route: 'an update', method: 'PUT', path: resourcePath(API_ROUTES.bjjEireCompetitions, UNPUBLISHED_OBJECT_ID) },
  {
    route: 'a publish',
    method: 'POST',
    path: `${resourcePath(API_ROUTES.bjjEireCompetitions, UNPUBLISHED_OBJECT_ID)}/publish`,
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
  'BJJ Éire competitions access API acceptance (switched on)',
  { tag: ['@competitions', '@bjjeire-competitions-on', '@api', '@squash'] },
  () => {
    const givenSwitchedOn = bjjEireCompetitionsSwitchedOnGiven();

    for (const { label, address, status, problem, errors } of COMPETITOR_LIST_ADDRESSES) {
      test(
        `client should get not found or bad request when asking for the competitors of a competition at ${label}`,
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
          await test.step('Given the environment has BJJ Éire competitions switched on', givenSwitchedOn);

          const response =
            await test.step(`When a client with no token requests the competitors of a competition at ${label}`, () =>
              requestBjjEireCompetitors(request, address));

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
          await test.step('Given the environment has BJJ Éire competitions switched on', givenSwitchedOn);

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
        `client should be refused the organiser competition routes without a token when requesting ${route}`,
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
          await test.step('Given the environment has BJJ Éire competitions switched on', givenSwitchedOn);

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
          await test.step('Given the environment has BJJ Éire competitions switched on', () => {
            givenSwitchedOn();
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
          await test.step('Given the environment has BJJ Éire competitions switched on', () => {
            givenSwitchedOn();
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
