// spec: specs/features/competitions.md
// seed: tests/agents/seed.spec.ts
import { test, competitionsTestConfig } from './fixtures';
import { SEEDED_DIRECTORY_GYM_NAME, SEEDED_DIRECTORY_GYM_PARTIAL_NAME } from './seeded';
import { waitUntilApiAcceptsSignIn } from './sign-in-again';
import { bjjEireCompetitionsSwitchedOnGiven } from './switched-on-ui';
import type { LocalCompetitor } from '@api/features/competitions/competitor.service';
import type { ProfileDetails } from '@ui/pages/competitions/competitions.types';
import { squash } from '@squash/annotations';

/** A complete profile for the fixture's competitor: the name is theirs (`PW <token>`), the rest is fixed. */
const profileFor = (competitor: LocalCompetitor): ProfileDetails => ({
  firstName: competitor.displayName,
  lastName: 'Tester',
  nationality: 'Ireland',
  dateOfBirth: '1990-05-15',
  gender: 'Male',
  belt: 'Blue',
});

test.use(competitionsTestConfig);

// Competitor account scenarios. Those that sign a competitor in take the `competitor` fixture (a fresh account,
// deleted afterwards, with every sign-up request aborted) and save the profile through the form, which is the
// behaviour under test.
test.describe(
  'Competitor account UI acceptance',
  { tag: ['@competitions', '@bjjeire-competitions-on', '@ui', '@desktop', '@squash'] },
  () => {
    const givenSwitchedOn = bjjEireCompetitionsSwitchedOnGiven();

    test.describe('with a signed-out visitor', () => {
      // True by construction: no stored sign-in, so the browser holds no competitor account whatever the environment.
      test.use({ storageState: { cookies: [], origins: [] } });

      test(
        'visitor should be offered competitor sign-in or registration when opening their account',
        {
          tag: '@acceptance',
          annotation: squash({
            weight: 'medium',
            status: 'work in progress',
            nature: 'functional',
            type: 'regression',
          }),
        },
        async ({ competitionsPage, competitorProfilePage, competitorSignInPage }) => {
          await test.step('Given BJJ Éire competitions are switched on', () => {
            givenSwitchedOn();
          });

          await test.step('When a visitor opens their account from the navigation', async () => {
            await competitionsPage.goTo();
            await competitorProfilePage.openFromAccountLink();
          });

          await test.step('Then the visitor is asked to sign in as a competitor', async () => {
            await competitorSignInPage.expectAskedToSignIn();
          });

          await test.step('And the visitor is offered to sign in or create an account', async () => {
            await competitorSignInPage.expectOfferedSignInOrRegistration();
          });

          await test.step('And no profile is shown', async () => {
            await competitorProfilePage.expectNoProfileShown();
          });
        },
      );
    });

    test.describe('with a signed-in competitor', () => {
      test(
        'competitor should see their saved profile again after signing back in',
        {
          tag: ['@acceptance', '@local-sign-in'],
          annotation: squash({ weight: 'high', status: 'work in progress', nature: 'functional', type: 'regression' }),
        },
        async ({ competitor, competitionsPage, competitorSignInPage, competitorProfilePage }) => {
          const details = profileFor(competitor);
          const academy = `${competitor.displayName} Academy`;

          await test.step('Given BJJ Éire competitions are switched on', () => {
            givenSwitchedOn();
          });

          await test.step('And a competitor has signed in with a new email', async () => {
            await competitorSignInPage.startSignedIn(competitor.session);
          });

          await test.step('When the competitor saves their name, nationality, date of birth, gender, belt and an academy', async () => {
            await competitionsPage.goTo();
            await competitorProfilePage.openFromAccountLink();
            await competitorProfilePage.expectCreateFormShown();
            await competitorProfilePage.fillDetails(details);
            await competitorProfilePage.typeAcademy(academy);
            await competitorProfilePage.save();
          });

          await test.step('And the competitor signs out and signs back in with the same email', async () => {
            await competitorProfilePage.signOut();
            await competitorSignInPage.expectAskedToSignIn();
            await competitorSignInPage.signInWithEmail(competitor.email);
            await competitorProfilePage.expectSavedProfileShown();
          });

          await test.step('Then the profile shows the details they saved', async () => {
            await competitorProfilePage.expectDetails(details);
          });

          await test.step('And the profile shows the email they signed in with', async () => {
            await competitorProfilePage.expectEmail(competitor.email);
          });
        },
      );

      test(
        'competitor should be saved with a gym from the directory as their academy',
        {
          tag: ['@acceptance', '@local-sign-in'],
          annotation: squash({
            weight: 'medium',
            status: 'work in progress',
            nature: 'functional',
            type: 'regression',
          }),
        },
        async ({ competitor, competitionsPage, competitorSignInPage, competitorProfilePage }) => {
          await test.step('Given BJJ Éire competitions are switched on', () => {
            givenSwitchedOn();
          });

          await test.step('And a competitor has signed in with a new email', async () => {
            await competitorSignInPage.startSignedIn(competitor.session);
          });

          await test.step('And the competitor has filled in their name, date of birth, gender and belt', async () => {
            await competitionsPage.goTo();
            await competitorProfilePage.openFromAccountLink();
            await competitorProfilePage.expectCreateFormShown();
            await competitorProfilePage.fillDetails(profileFor(competitor));
          });

          await test.step('When the competitor says their academy is in the gym directory', async () => {
            await competitorProfilePage.chooseAcademyDirectory();
          });

          await test.step("And the competitor searches for part of a seeded gym's name and picks it", async () => {
            await competitorProfilePage.searchAndPickGym(SEEDED_DIRECTORY_GYM_PARTIAL_NAME, SEEDED_DIRECTORY_GYM_NAME);
          });

          await test.step('And the competitor saves the profile', async () => {
            await competitorProfilePage.save();
          });

          await test.step('Then the profile shows that gym as their academy', async () => {
            await competitorProfilePage.expectDirectoryAcademy(SEEDED_DIRECTORY_GYM_NAME);
          });
        },
      );

      test(
        'competitor should be saved with an academy typed by hand when theirs is not listed',
        {
          tag: ['@acceptance', '@local-sign-in'],
          annotation: squash({
            weight: 'medium',
            status: 'work in progress',
            nature: 'functional',
            type: 'regression',
          }),
        },
        async ({ competitor, competitionsPage, competitorSignInPage, competitorProfilePage }) => {
          await test.step('Given BJJ Éire competitions are switched on', () => {
            givenSwitchedOn();
          });

          await test.step('And a competitor has signed in with a new email', async () => {
            await competitorSignInPage.startSignedIn(competitor.session);
          });

          await test.step('And the competitor has filled in their name, date of birth, gender and belt', async () => {
            await competitionsPage.goTo();
            await competitorProfilePage.openFromAccountLink();
            await competitorProfilePage.expectCreateFormShown();
            await competitorProfilePage.fillDetails(profileFor(competitor));
          });

          await test.step('When the competitor says their academy is not listed and types its name', async () => {
            await competitorProfilePage.typeAcademy(`${competitor.displayName} Academy`);
          });

          await test.step('And the competitor saves the profile', async () => {
            await competitorProfilePage.save();
          });

          await test.step('Then the profile shows the typed academy name', async () => {
            await competitorProfilePage.expectTypedAcademy(`${competitor.displayName} Academy`);
          });
        },
      );

      test(
        'competitor should be saved with no academy and no affiliation when they choose neither',
        {
          tag: ['@acceptance', '@local-sign-in'],
          annotation: squash({
            weight: 'medium',
            status: 'work in progress',
            nature: 'functional',
            type: 'regression',
          }),
        },
        async ({ competitor, competitionsPage, competitorSignInPage, competitorProfilePage }) => {
          await test.step('Given BJJ Éire competitions are switched on', () => {
            givenSwitchedOn();
          });

          await test.step('And a competitor has signed in with a new email', async () => {
            await competitorSignInPage.startSignedIn(competitor.session);
          });

          await test.step('And the competitor has filled in their name, date of birth, gender and belt', async () => {
            await competitionsPage.goTo();
            await competitorProfilePage.openFromAccountLink();
            await competitorProfilePage.expectCreateFormShown();
            await competitorProfilePage.fillDetails(profileFor(competitor));
          });

          await test.step('When the competitor chooses no academy and leaves the affiliation empty', async () => {
            await competitorProfilePage.chooseNoAcademy();
          });

          await test.step('And the competitor saves the profile', async () => {
            await competitorProfilePage.save();
          });

          await test.step('Then the profile shows no academy', async () => {
            await competitorProfilePage.expectNoAcademy();
          });

          await test.step('And the profile shows no affiliation', async () => {
            await competitorProfilePage.expectNoAffiliation();
          });
        },
      );
    });

    test.describe('with a signed-in competitor who has a saved profile', () => {
      test.use({ competitorProfile: { gender: 'MALE', belt: 'BLUE', dateOfBirth: '1990-05-15' } });

      test(
        'competitor should see no medals and no competitions entered before any results',
        {
          tag: ['@acceptance', '@local-sign-in'],
          annotation: squash({
            weight: 'medium',
            status: 'work in progress',
            nature: 'functional',
            type: 'regression',
          }),
        },
        async ({ competitor, competitionsPage, competitorSignInPage, competitorProfilePage }) => {
          await test.step('Given BJJ Éire competitions are switched on', () => {
            givenSwitchedOn();
          });

          await test.step('And a competitor has signed in with a new email and saved a profile', async () => {
            await competitorSignInPage.startSignedIn(competitor.session);
          });

          await test.step('When the competitor opens their profile', async () => {
            await competitionsPage.goTo();
            await competitorProfilePage.openFromAccountLink();
            await competitorProfilePage.expectSavedProfileShown();
          });

          await test.step('Then the profile shows 0 gold, 0 silver and 0 bronze', async () => {
            await competitorProfilePage.expectMedals({ gold: 0, silver: 0, bronze: 0 });
          });

          await test.step('And the profile says they have not entered a competition yet', async () => {
            await competitorProfilePage.expectNoCompetitionsEntered();
          });
        },
      );
    });

    test.describe('with a signed-in competitor who has a saved profile and deletes their account', () => {
      test.use({ competitorProfile: { gender: 'MALE', belt: 'BLUE', dateOfBirth: '1990-05-15' } });

      test(
        'competitor should be able to sign up again with the same email after deleting their account',
        {
          tag: ['@acceptance', '@local-sign-in'],
          annotation: squash({ weight: 'high', status: 'work in progress', nature: 'functional', type: 'regression' }),
        },
        async ({ playwright, competitor, competitionsPage, competitorSignInPage, competitorProfilePage }) => {
          await test.step('Given BJJ Éire competitions are switched on', () => {
            givenSwitchedOn();
          });

          await test.step('And a competitor has signed in with a new email and saved a profile', async () => {
            await competitorSignInPage.startSignedIn(competitor.session);
          });

          await test.step('When the competitor deletes their account', async () => {
            await competitionsPage.goTo();
            await competitorProfilePage.openFromAccountLink();
            await competitorProfilePage.expectSavedProfileShown();
            await competitorProfilePage.deleteAccount();
            await competitorSignInPage.expectAskedToSignIn();
          });

          await test.step('And signs up again with the same email', async () => {
            // Setup, not the visitor's path: the API refuses a token whose whole-second `iat` is not later than the
            // deletion (`MongoRevokedCompetitors`), so a sign-in in the deletion's own second signs in and then cannot
            // load the profile (finding F13, which this scenario does not cover). Wait until the API itself accepts a
            // fresh sign-in for this email; the sign-in below is then accepted too. The probe writes nothing.
            await waitUntilApiAcceptsSignIn(playwright, competitor.email);
            await competitorSignInPage.signInWithEmail(competitor.email);
          });

          await test.step('Then the visitor is offered to create a competitor profile', async () => {
            await competitorProfilePage.expectCreateFormShown();
          });

          await test.step("And none of the deleted profile's details are shown", async () => {
            await competitorProfilePage.expectEmptyForm();
          });
        },
      );
    });
  },
);
