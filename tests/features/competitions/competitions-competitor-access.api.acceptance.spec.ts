// spec: specs/features/competitions.md
import { test, expect } from './fixtures.api';
import { requestAsCompetitor } from '@api/features/competitions/bjjeire-competitions.service';
import { requestOwnCompetitor } from '@api/features/competitions/competitor.service';
import { API_ROUTES, expectProblem, ProblemType, resourcePath } from '@api/support';
import { squash } from '@squash/annotations';
import { UNPUBLISHED_OBJECT_ID } from '../common/testdata/invalid-values';
import { bjjEireCompetitionsSwitchedOnGiven } from './switched-on';

// A competitor's valid token must be refused on every write route that is not theirs. Every request here is one the API
// must refuse before it acts, and even a regressed rule would hit an empty body (400) or an id that exists nowhere
// (404): never a seeded id, never a real PUT. The competitor is signed in with no profile.
test.use({ requestAuth: 'none' });

// Gym and event have write handlers (a new entry with an empty body would be a 400, a missing id a 404). Competition and
// store have none: their rows guard only the catch-all write rule for read-only sections, and without it they would be 405.
const DIRECTORY_SECTIONS = [
  { section: 'gym', collection: API_ROUTES.gyms },
  { section: 'event', collection: API_ROUTES.bjjEvents },
  { section: 'competition', collection: API_ROUTES.competitions },
  { section: 'store', collection: API_ROUTES.stores },
] as const;

const DIRECTORY_WRITES = DIRECTORY_SECTIONS.flatMap(
  ({ section, collection }) =>
    [
      { route: `a new ${section}`, method: 'POST', path: collection, data: {} },
      { route: `a ${section} deletion`, method: 'DELETE', path: resourcePath(collection, UNPUBLISHED_OBJECT_ID) },
    ] as const,
);

const COMPETITION_ID_PATH = resourcePath(API_ROUTES.bjjEireCompetitions, UNPUBLISHED_OBJECT_ID);

const ORGANISER_ROUTES = [
  { route: 'the organiser list', method: 'GET', path: `${API_ROUTES.bjjEireCompetitions}/admin` },
  { route: 'a new competition', method: 'POST', path: API_ROUTES.bjjEireCompetitions, data: {} },
  { route: "a competition's sign-up list", method: 'GET', path: `${COMPETITION_ID_PATH}/registration` },
  { route: 'a competition cancellation', method: 'POST', path: `${COMPETITION_ID_PATH}/cancel` },
  { route: 'a team-name merge', method: 'POST', path: `${COMPETITION_ID_PATH}/team-merge`, data: {} },
] as const;

const SQUASH = squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' });

test.describe(
  'BJJ Éire competitions competitor access API acceptance (switched on)',
  { tag: ['@competitions', '@bjjeire-competitions-on', '@api', '@squash'] },
  () => {
    const givenSwitchedOn = bjjEireCompetitionsSwitchedOnGiven();

    const andCompetitorSignedIn = async (
      request: Parameters<typeof requestOwnCompetitor>[0],
      token: string,
    ): Promise<void> => {
      expect((await requestOwnCompetitor(request, token)).status()).toBe(200);
    };

    for (const { route, method, path, ...rest } of DIRECTORY_WRITES) {
      test(
        `client should be refused changing a directory section with a competitor token when requesting ${route}`,
        { tag: ['@acceptance', '@local-sign-in'], annotation: SQUASH },
        async ({ request, competitor }) => {
          await test.step('Given the environment has BJJ Éire competitions switched on', givenSwitchedOn);

          await test.step('And a competitor has signed in with a new email', () =>
            andCompetitorSignedIn(request, competitor.token));

          const response = await test.step(`When the competitor requests ${route}`, () =>
            requestAsCompetitor(request, competitor, { method, path, ...('data' in rest ? { data: rest.data } : {}) }));

          await test.step('Then the request is refused as forbidden', async () => {
            await expectProblem(response, 403, ProblemType.Forbidden);
          });
        },
      );
    }

    for (const { route, method, path, ...rest } of ORGANISER_ROUTES) {
      test(
        `client should be refused the organiser competition routes with a competitor token when requesting ${route}`,
        { tag: ['@acceptance', '@local-sign-in'], annotation: SQUASH },
        async ({ request, competitor }) => {
          await test.step('Given the environment has BJJ Éire competitions switched on', givenSwitchedOn);

          await test.step('And a competitor has signed in with a new email', () =>
            andCompetitorSignedIn(request, competitor.token));

          const response = await test.step(`When the competitor requests ${route}`, () =>
            requestAsCompetitor(request, competitor, { method, path, ...('data' in rest ? { data: rest.data } : {}) }));

          await test.step('Then the request is refused as forbidden', async () => {
            await expectProblem(response, 403, ProblemType.Forbidden);
          });
        },
      );
    }
  },
);
