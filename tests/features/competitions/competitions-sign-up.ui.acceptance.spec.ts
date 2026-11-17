// spec: specs/features/competitions.md
// seed: tests/agents/seed.spec.ts
import { test, competitionsTestConfig } from './fixtures';
import {
  SEEDED_BJJEIRE_OPEN,
  SEEDED_BJJEIRE_OPEN_BLUE_BELT_MALE_DIVISIONS,
  SEEDED_BJJEIRE_OPEN_OTHER_DIVISIONS,
  SEEDED_BJJEIRE_OPEN_WHITE_BELT_MALE_DIVISIONS,
  SEEDED_FEATURED_COMPETITIONS,
} from './seeded';
import { bjjEireCompetitionsSwitchedOnGiven } from './switched-on-ui';
import { squash } from '@squash/annotations';

test.use(competitionsTestConfig);

const openCompetition = SEEDED_BJJEIRE_OPEN;
const [openCard] = SEEDED_FEATURED_COMPETITIONS;
const COMPETITION_DAY_AGE = 35;
/** Born on 1 January, so the competitor is `COMPETITION_DAY_AGE` on the seeded day (under Master 2 at 36), never a fixed date. */
const dateOfBirthAgedOnSeededDay = `${Number(openCompetition.date.split('-')[0]) - COMPETITION_DAY_AGE}-01-01`;

const ADULT_AGE = 18;
const DATE_LENGTH = 10;
/** Exactly 18 years before the seeded day: 18 on it (the birthday itself counts as 18). */
function dateOfBirthEighteenOn(day: string): string {
  const born = new Date(`${day}T00:00:00Z`);
  born.setUTCFullYear(born.getUTCFullYear() - ADULT_AGE);
  return born.toISOString().slice(0, DATE_LENGTH);
}

/** One day after that cut-off: 17 on the seeded day, turning 18 the next day. */
function dateOfBirthSeventeenOn(day: string): string {
  const born = new Date(`${dateOfBirthEighteenOn(day)}T00:00:00Z`);
  born.setUTCDate(born.getUTCDate() + 1);
  return born.toISOString().slice(0, DATE_LENGTH);
}

// Scenarios that sign a competitor in through the stack's local sign-in (@local-sign-in). None submits the sign-up
// form: a sign-up on a seeded competition can never be given back.
test.describe(
  'BJJ Éire competition sign-up UI acceptance',
  { tag: ['@competitions', '@bjjeire-competitions-on', '@ui', '@desktop', '@squash'] },
  () => {
    const givenSwitchedOn = bjjEireCompetitionsSwitchedOnGiven();

    // The cut-off is the 18th birthday: one day short of it is refused, the birthday itself is allowed.
    test.describe('with a signed-in competitor who is 17 on the competition day', () => {
      test.use({
        competitorProfile: { gender: 'MALE', belt: 'WHITE', dateOfBirth: dateOfBirthSeventeenOn(openCompetition.date) },
      });

      test(
        'competitor should be told they cannot enter when they are 17 on the competition day',
        {
          tag: ['@acceptance', '@local-sign-in'],
          annotation: squash({
            weight: 'medium',
            status: 'work in progress',
            nature: 'functional',
            type: 'regression',
          }),
        },
        async ({ competitor, bjjEireCompetitionPage, competitorSignInPage, signUpPage }) => {
          await test.step('Given BJJ Éire competitions are switched on', () => {
            givenSwitchedOn();
          });

          await test.step('And a competitor has signed in with a new email and saved a profile that makes them 17 on the competition day', async () => {
            await competitorSignInPage.startSignedIn(competitor.session);
          });

          await test.step('When the competitor opens the sign-up for the "Acceptance Open" competition from its page', async () => {
            await bjjEireCompetitionPage.goTo(openCompetition.slug);
            await bjjEireCompetitionPage.chooseSignUp();
          });

          // Nothing on the sign-up page is submitted: a sign-up takes a seeded place for good.
          await test.step('Then the competitor is told they must be 18 or over on the competition day', async () => {
            await signUpPage.expectToldMustBeEighteen();
          });

          await test.step('And no division is offered and nothing can be paid', async () => {
            await signUpPage.expectNothingToChooseOrPay();
          });
        },
      );
    });

    test.describe('with a signed-in competitor who is 18 on the competition day', () => {
      test.use({
        competitorProfile: { gender: 'MALE', belt: 'WHITE', dateOfBirth: dateOfBirthEighteenOn(openCompetition.date) },
      });

      test(
        'competitor should be offered the adult division when they turn 18 on the competition day',
        {
          tag: ['@acceptance', '@local-sign-in'],
          annotation: squash({
            weight: 'medium',
            status: 'work in progress',
            nature: 'functional',
            type: 'regression',
          }),
        },
        async ({ competitor, bjjEireCompetitionPage, competitorSignInPage, signUpPage }) => {
          await test.step('Given BJJ Éire competitions are switched on', () => {
            givenSwitchedOn();
          });

          await test.step('And a competitor has signed in with a new email and saved a profile that makes them 18 on the competition day', async () => {
            await competitorSignInPage.startSignedIn(competitor.session);
          });

          await test.step('When the competitor opens the sign-up for the "Acceptance Open" competition from its page', async () => {
            await bjjEireCompetitionPage.goTo(openCompetition.slug);
            await bjjEireCompetitionPage.chooseSignUp();
          });

          // Nothing on the sign-up page is submitted: a sign-up takes a seeded place for good.
          await test.step('Then the adult division is offered', async () => {
            await signUpPage.expectDivisionsOffered(SEEDED_BJJEIRE_OPEN_WHITE_BELT_MALE_DIVISIONS);
          });

          await test.step('And the competitor is not told they must be 18 or over on the competition day', async () => {
            await signUpPage.expectNotToldMustBeEighteen();
          });
        },
      );
    });

    test.describe('with a signed-in competitor who has a complete profile and no sign-up', () => {
      test.use({ competitorProfile: { gender: 'MALE', belt: 'WHITE', dateOfBirth: dateOfBirthAgedOnSeededDay } });

      test(
        'competitor should see no sign-ups before signing up for a competition',
        {
          tag: ['@acceptance', '@local-sign-in'],
          annotation: squash({
            weight: 'medium',
            status: 'work in progress',
            nature: 'functional',
            type: 'regression',
          }),
        },
        async ({ competitor, bjjEireCompetitionPage, competitorSignInPage, mySignUpsPage }) => {
          await test.step('Given BJJ Éire competitions are switched on', () => {
            givenSwitchedOn();
          });

          await test.step('And a competitor has signed in with a new email and saved a complete profile', async () => {
            await competitorSignInPage.startSignedIn(competitor.session);
          });

          await test.step('When the competitor opens their sign-ups', async () => {
            await bjjEireCompetitionPage.goTo(openCompetition.slug);
            await bjjEireCompetitionPage.chooseMySignUps();
          });

          await test.step('Then the sign-ups page says the competitor has not signed up for a competition yet', async () => {
            await mySignUpsPage.expectEmptyMessage();
          });

          await test.step('And no sign-up is listed', async () => {
            await mySignUpsPage.expectNoSignUpsListed();
          });
        },
      );
    });

    test.describe('with a signed-in male blue belt competitor', () => {
      test.use({ competitorProfile: { gender: 'MALE', belt: 'BLUE', dateOfBirth: dateOfBirthAgedOnSeededDay } });

      test(
        'competitor should be offered only the divisions for their gender, belt and age',
        {
          tag: ['@acceptance', '@local-sign-in'],
          annotation: squash({ weight: 'high', status: 'work in progress', nature: 'functional', type: 'regression' }),
        },
        async ({ competitor, bjjEireCompetitionPage, competitorSignInPage, signUpPage }) => {
          await test.step('Given BJJ Éire competitions are switched on', () => {
            givenSwitchedOn();
          });

          // The fixture's session is seeded before the page loads, so sign-in is not what this scenario is about.
          await test.step('And a competitor has signed in with a new email and saved a complete profile as a male blue belt aged 35 on the competition day', async () => {
            await competitorSignInPage.startSignedIn(competitor.session);
          });

          await test.step('When the competitor opens the sign-up for the "Acceptance Open" competition from its page', async () => {
            await bjjEireCompetitionPage.goTo(openCompetition.slug);
            await bjjEireCompetitionPage.chooseSignUp();
          });

          // Nothing on the sign-up page is submitted: a sign-up takes a seeded place for good.
          await test.step('Then only the blue-belt male adult division is offered', async () => {
            await signUpPage.expectDivisionsOffered(SEEDED_BJJEIRE_OPEN_BLUE_BELT_MALE_DIVISIONS);
          });

          await test.step('And no division for another gender or belt is offered', async () => {
            await signUpPage.expectDivisionsNotOffered(SEEDED_BJJEIRE_OPEN_OTHER_DIVISIONS);
          });

          await test.step('And the entry fee €25.00 is shown before paying', async () => {
            await signUpPage.expectEntryFee(openCard.fee);
          });
        },
      );
    });

    test.describe('with a signed-out visitor who has a complete competitor profile', () => {
      // True by construction: no stored sign-in, so the browser holds no competitor account whatever the environment.
      test.use({ storageState: { cookies: [], origins: [] } });
      test.use({ competitorProfile: { gender: 'MALE', belt: 'WHITE', dateOfBirth: '1990-01-01' } });

      test(
        'visitor should be asked to sign in and come back to the sign-up when signing up for a BJJ Éire competition',
        {
          tag: ['@acceptance', '@local-sign-in'],
          annotation: squash({ weight: 'high', status: 'work in progress', nature: 'functional', type: 'regression' }),
        },
        async ({ competitor, bjjEireCompetitionPage, competitorSignInPage, signUpPage }) => {
          await test.step('Given BJJ Éire competitions are switched on', () => {
            givenSwitchedOn();
          });

          // The fixture signs the competitor in over the API only, so the browser holds no session.
          await test.step('And a visitor is not signed in', async () => {
            await bjjEireCompetitionPage.goTo(openCompetition.slug);
          });

          await test.step('When the visitor chooses Sign up on a competition whose registration is open', async () => {
            await bjjEireCompetitionPage.chooseSignUp();
            await competitorSignInPage.expectAskedToSignIn();
          });

          await test.step('And the visitor signs in as a competitor with a complete profile', async () => {
            await competitorSignInPage.signInWithEmail(competitor.email);
          });

          // Nothing on the sign-up page is submitted: a sign-up takes a seeded place for good.
          await test.step('Then the visitor is on the sign-up for that competition', async () => {
            await signUpPage.expectForCompetition(openCompetition.name);
          });

          await test.step('And the divisions they may enter are offered', async () => {
            await signUpPage.expectDivisionsOffered(SEEDED_BJJEIRE_OPEN_WHITE_BELT_MALE_DIVISIONS);
          });
        },
      );
    });
  },
);
