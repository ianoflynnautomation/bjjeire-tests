// spec: specs/features/tournaments.md
import { test, expect } from './fixtures.api';
import {
  getOwnCompetitor,
  profileBody,
  requestOwnCompetitor,
  removeLocalCompetitor,
  signInLocalCompetitor,
  type CompetitorProfileOptions,
} from '@api/features/tournaments/competitor.service';
import { requestAsCompetitorWithBody } from '@api/features/tournaments/tournaments.service';
import { API_ROUTES, expectProblem, ProblemType, ValidationErrorCode } from '@api/support';
import { squash } from '@squash/annotations';
import { UNPUBLISHED_OBJECT_ID } from '../common/testdata/invalid-values';
import { tournamentsSwitchedOnGiven } from './tournaments-switched-on';

// The competitor's own profile. Nothing here touches a tournament or a sign-up; the fixture deletes the competitor.
test.use({ requestAuth: 'none' });

const VALID_PROFILE: CompetitorProfileOptions = { gender: 'FEMALE', belt: 'BLUE', dateOfBirth: '1990-01-01' };

const FIRST_NAME_MAX = 60;
const AFFILIATION_MAX = 80;
const MS_PER_DAY = 86_400_000;
const tomorrow = (): string => new Date(Date.now() + MS_PER_DAY).toISOString().split('T')[0] ?? '';

// One field changed per row of an otherwise valid body; each is a 400 validation problem on that field, confirmed
// live 2026-11-16. A refusal must save nothing, so the profile stays unsaved afterwards.
const INVALID_PROFILE_VALUES = [
  {
    field: 'first name',
    value: 'blank',
    change: { firstName: '' },
    error: { field: 'FirstName', errorCode: 'FIELD_REQUIRED' },
  },
  {
    field: 'first name',
    value: '61 characters',
    change: { firstName: 'a'.repeat(FIRST_NAME_MAX + 1) },
    error: { field: 'FirstName', errorCode: 'MAX_LENGTH_EXCEEDED' },
  },
  {
    field: 'last name',
    value: 'blank',
    change: { lastName: '' },
    error: { field: 'LastName', errorCode: 'FIELD_REQUIRED' },
  },
  {
    field: 'nationality',
    value: 'XX1',
    change: { nationality: 'XX1' },
    error: { field: 'Nationality', errorCode: 'IsoCountry' },
  },
  {
    field: 'date of birth',
    value: 'tomorrow',
    change: () => ({ dateOfBirth: tomorrow() }),
    error: { field: 'DateOfBirth', errorCode: 'Past' },
  },
  {
    field: 'date of birth',
    value: 'missing',
    change: { dateOfBirth: undefined },
    error: { field: 'DateOfBirth', errorCode: ValidationErrorCode.NotNull },
  },
  {
    field: 'affiliation',
    value: '81 characters',
    change: { affiliation: 'a'.repeat(AFFILIATION_MAX + 1) },
    error: { field: 'Affiliation', errorCode: 'MAX_LENGTH_EXCEEDED' },
  },
  {
    field: 'phone',
    value: 'abc',
    change: { phone: 'abc' },
    error: { field: 'Phone', errorCode: ValidationErrorCode.InvalidFormat },
  },
  {
    field: 'academy',
    value: 'a gym id that exists nowhere',
    change: { academy: { gymId: UNPUBLISHED_OBJECT_ID } },
    error: { field: 'Academy.GymId', errorCode: 'UNKNOWN_GYM' },
  },
] as const;

const SQUASH = squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' });

test.describe(
  'Tournaments profile API acceptance (switched on)',
  { tag: ['@tournaments', '@tournaments-on', '@api', '@squash'] },
  () => {
    const givenTournamentsSwitchedOn = tournamentsSwitchedOnGiven();

    test(
      'competitor should get an empty incomplete profile with their sign-in email before saving one',
      { tag: ['@acceptance', '@local-sign-in'], annotation: SQUASH },
      async ({ request, competitor }) => {
        await test.step('Given the environment has tournaments switched on', givenTournamentsSwitchedOn);

        await test.step('And a competitor has signed in with a new email', async () => {
          expect((await requestOwnCompetitor(request, competitor.token)).status()).toBe(200);
        });

        const profile = await test.step('When the competitor reads their profile', () =>
          getOwnCompetitor(request, competitor.token));

        await test.step('Then the profile is not complete', () => {
          expect(profile.profileComplete).toBe(false);
          expect(profile.saved).toBe(false);
        });

        await test.step('And the profile shows the email they signed in with', () => {
          expect(profile.email).toBe(competitor.email);
        });

        await test.step('And the profile has no name', () => {
          expect(profile.firstName ?? null).toBeNull();
          expect(profile.lastName ?? null).toBeNull();
        });
      },
    );

    for (const { field, value, change, error } of INVALID_PROFILE_VALUES) {
      test(
        `client should be refused a profile save with an invalid value when ${field} is ${value}`,
        { tag: ['@acceptance', '@local-sign-in'], annotation: SQUASH },
        async ({ request, competitor }) => {
          await test.step('Given the environment has tournaments switched on', givenTournamentsSwitchedOn);

          await test.step('And a competitor has signed in with a new email', async () => {
            expect((await getOwnCompetitor(request, competitor.token)).email).toBe(competitor.email);
          });

          const response = await test.step(`When the competitor saves a profile where ${field} is ${value}`, () =>
            requestAsCompetitorWithBody(request, competitor, {
              method: 'PUT',
              path: API_ROUTES.competitorMe,
              data: {
                ...profileBody(competitor.displayName, VALID_PROFILE),
                ...(typeof change === 'function' ? change() : change),
              },
            }));

          await test.step('Then the response is a bad-request or validation problem document', async () => {
            const body = await expectProblem(response, 400, ProblemType.Validation);
            expect(body.errors ?? []).toEqual(expect.arrayContaining([expect.objectContaining(error)]));
          });

          await test.step('And no profile is saved', async () => {
            const profile = await getOwnCompetitor(request, competitor.token);
            expect(profile.saved).toBe(false);
            expect(profile.profileComplete).toBe(false);
          });
        },
      );
    }

    test.describe('with a saved profile', () => {
      test.use({ competitorProfile: VALID_PROFILE });

      test(
        'competitor should keep one profile when saving it twice and signing in again with the same email',
        { tag: ['@acceptance', '@local-sign-in'], annotation: SQUASH },
        async ({ request, competitor }) => {
          const secondName = `${competitor.displayName} second`;

          await test.step('Given the environment has tournaments switched on', givenTournamentsSwitchedOn);

          await test.step('And a competitor has signed in with a new email and saved a complete profile', async () => {
            const profile = await getOwnCompetitor(request, competitor.token);
            expect(profile).toMatchObject({
              email: competitor.email,
              firstName: competitor.displayName,
              gender: VALID_PROFILE.gender,
              belt: VALID_PROFILE.belt,
              dateOfBirth: VALID_PROFILE.dateOfBirth,
              profileComplete: true,
            });
          });

          await test.step('When the competitor saves the profile again with a different name', async () => {
            const response = await requestAsCompetitorWithBody(request, competitor, {
              method: 'PUT',
              path: API_ROUTES.competitorMe,
              data: profileBody(secondName, VALID_PROFILE),
            });
            expect(response.status()).toBe(200);
          });

          const again = await test.step('And the competitor signs in again with the same email', () =>
            signInLocalCompetitor(request, competitor.email));

          // The fixture deletes the original competitor only; a sign-in that wrongly made a new one must not leak it.
          try {
            await test.step('Then the profile shows the second name', async () => {
              expect((await getOwnCompetitor(request, again.accessToken)).firstName).toBe(secondName);
            });

            await test.step('And the profile is complete', async () => {
              expect((await getOwnCompetitor(request, again.accessToken)).profileComplete).toBe(true);
            });
          } finally {
            await removeLocalCompetitor(request, { email: competitor.email, token: again.accessToken });
          }
        },
      );
    });
  },
);
