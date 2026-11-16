// spec: specs/features/tournaments.md
import { test, expect } from './fixtures.api';
import { requestOwnCompetitor } from '@api/features/tournaments/competitor.service';
import {
  getTournamentDivisions,
  requestAsCompetitor,
  requestAsCompetitorWithBody,
} from '@api/features/tournaments/tournaments.service';
import { API_ROUTES, expectProblem, ProblemType, resourcePath, ValidationErrorCode } from '@api/support';
import { squash } from '@squash/annotations';
import { INVALID_OBJECT_ID_VALUES, UNPUBLISHED_OBJECT_ID } from '../common/testdata/invalid-values';
import { tournamentsSwitchedOnGiven } from './tournaments-switched-on';

// Cancelling and moving a sign-up. Every request names an id that exists nowhere or is malformed, so nothing is
// cancelled or moved even if a refusal regressed; a real sign-up is never touched. The competitor has no profile.
test.use({ requestAuth: 'none' });

const ID_ERROR = { field: 'Id', errorCode: ValidationErrorCode.InvalidFormat };

const MALFORMED_IDS = INVALID_OBJECT_ID_VALUES.map(({ description, value }) => ({
  kind: `malformed as ${description}`,
  id: value,
}));

const CANCEL_IDS = [
  {
    kind: 'one that does not exist',
    id: UNPUBLISHED_OBJECT_ID,
    status: 404,
    problem: ProblemType.NotFound,
    errors: [],
  },
  ...MALFORMED_IDS.map(malformed => ({
    ...malformed,
    status: 400,
    problem: ProblemType.Validation,
    errors: [ID_ERROR],
  })),
];

// Confirmed live 2026-11-16: the sign-up id and the body are validated before the sign-up is looked up.
const MOVE_REQUESTS = [
  {
    kind: 'for a sign-up that does not exist',
    id: UNPUBLISHED_OBJECT_ID,
    body: { divisionId: 'REAL' },
    status: 404,
    problem: ProblemType.NotFound,
    errors: [],
  },
  {
    kind: 'for a malformed sign-up id',
    id: 'not-an-id',
    body: { divisionId: 'REAL' },
    status: 400,
    problem: ProblemType.Validation,
    errors: [ID_ERROR],
  },
  {
    kind: 'missing a division',
    id: UNPUBLISHED_OBJECT_ID,
    body: {},
    status: 400,
    problem: ProblemType.Validation,
    errors: [{ field: 'DivisionId', errorCode: ValidationErrorCode.NotNull }],
  },
  {
    kind: 'for a malformed division id',
    id: UNPUBLISHED_OBJECT_ID,
    body: { divisionId: 'not-an-id' },
    status: 400,
    problem: ProblemType.Validation,
    errors: [{ field: 'DivisionId', errorCode: ValidationErrorCode.InvalidFormat }],
  },
] as const;

const SQUASH = squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' });

test.describe(
  'Tournaments sign-up changes API acceptance (switched on)',
  { tag: ['@tournaments', '@tournaments-on', '@api', '@squash'] },
  () => {
    const givenTournamentsSwitchedOn = tournamentsSwitchedOnGiven();

    for (const { kind, id, status, problem, errors } of CANCEL_IDS) {
      test(
        `client should get not found or bad request when cancelling a sign-up that is ${kind}`,
        { tag: ['@acceptance', '@local-sign-in'], annotation: SQUASH },
        async ({ request, competitor }) => {
          await test.step('Given the environment has tournaments switched on', givenTournamentsSwitchedOn);

          await test.step('And a competitor has signed in with a new email', async () => {
            expect((await requestOwnCompetitor(request, competitor.token)).status()).toBe(200);
          });

          const response = await test.step(`When the competitor cancels a sign-up that is ${kind}`, () =>
            requestAsCompetitor(request, competitor, {
              method: 'POST',
              path: `${resourcePath(API_ROUTES.registrations, id)}/cancel`,
            }));

          await test.step('Then the response is a problem document of the matching type', async () => {
            const body = await expectProblem(response, status, problem);
            expect(body.errors ?? []).toEqual(
              expect.arrayContaining(errors.map(error => expect.objectContaining(error))),
            );
          });
        },
      );
    }

    for (const { kind, id, body: requestBody, status, problem, errors } of MOVE_REQUESTS) {
      test(
        `client should get not found or bad request when moving a sign-up to another division and the request is ${kind}`,
        { tag: ['@acceptance', '@local-sign-in'], annotation: SQUASH },
        async ({ request, competitor }) => {
          // A division of acceptance-closed that no sign-up holds: the sign-up id is what is missing or malformed.
          const realDivisionId = await test.step('Given the environment has tournaments switched on', async () => {
            givenTournamentsSwitchedOn();
            return (await getTournamentDivisions(request, 'acceptance-closed')).divisions[0]?.id ?? '';
          });

          await test.step('And a competitor has signed in with a new email', async () => {
            expect((await requestOwnCompetitor(request, competitor.token)).status()).toBe(200);
          });

          const response =
            await test.step(`When the competitor asks to move a sign-up and the request is ${kind}`, () =>
              requestAsCompetitorWithBody(request, competitor, {
                method: 'PUT',
                path: `${resourcePath(API_ROUTES.registrations, id)}/division`,
                data:
                  'divisionId' in requestBody && requestBody.divisionId === 'REAL'
                    ? { divisionId: realDivisionId }
                    : requestBody,
              }));

          await test.step('Then the response is a problem document of the matching type', async () => {
            const problemBody = await expectProblem(response, status, problem);
            expect(problemBody.errors ?? []).toEqual(
              expect.arrayContaining(errors.map(error => expect.objectContaining(error))),
            );
          });
        },
      );
    }
  },
);
