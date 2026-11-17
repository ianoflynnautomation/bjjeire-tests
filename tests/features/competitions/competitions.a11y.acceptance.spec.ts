// spec: specs/features/competitions.md
// seed: tests/agents/seed.spec.ts
import { test, competitionsTestConfig } from './fixtures';
import {
  SEEDED_BJJEIRE_CLOSED,
  SEEDED_BJJEIRE_OPEN,
  SEEDED_BJJEIRE_OPEN_WHITE_BELT_MALE_DIVISIONS,
  SEEDED_FEATURED_COMPETITIONS,
} from './seeded';
import { bjjEireCompetitionsSwitchedOnGiven } from './switched-on-ui';
import { expectNoWcagViolations } from '@ui/support';
import { squash } from '@squash/annotations';

test.use(competitionsTestConfig);

const closedCompetition = SEEDED_BJJEIRE_CLOSED;
const openCompetition = SEEDED_BJJEIRE_OPEN;
const COMPETITION_DAY_AGE = 35;
/** Born on 1 January, so the competitor is `COMPETITION_DAY_AGE` on the seeded day: a white-belt adult man, never a fixed date. */
const dateOfBirthAgedOnSeededDay = `${Number(openCompetition.date.split('-')[0]) - COMPETITION_DAY_AGE}-01-01`;

test.describe(
  'BJJ Éire competitions accessibility acceptance',
  { tag: ['@competitions', '@bjjeire-competitions-on', '@a11y', '@desktop', '@squash'] },
  () => {
    const givenSwitchedOn = bjjEireCompetitionsSwitchedOnGiven();

    test(
      'visitor should find no accessibility violations on the featured BJJ Éire competitions',
      {
        tag: '@acceptance',
        annotation: squash({
          weight: 'medium',
          status: 'work in progress',
          nature: 'non functional',
          type: 'regression',
        }),
      },
      async ({ page, competitionsPage }) => {
        await test.step('Given BJJ Éire competitions are switched on', () => {
          givenSwitchedOn();
        });

        await test.step('When a visitor opens Competitions', async () => {
          await competitionsPage.goTo();
          // Every featured card is on screen, so the scan sees the registration badges, not the loading state.
          for (const featured of SEEDED_FEATURED_COMPETITIONS) {
            await competitionsPage.expectFeaturedStatus(featured.name, featured.status);
          }
          await competitionsPage.expectListNotEmpty();
        });

        await test.step('Then Competitions and its featured section have no accessibility violations', async () => {
          await expectNoWcagViolations(page);
        });
      },
    );

    test(
      "visitor should find no accessibility violations on a BJJ Éire competition's page",
      {
        tag: '@acceptance',
        annotation: squash({
          weight: 'medium',
          status: 'work in progress',
          nature: 'non functional',
          type: 'regression',
        }),
      },
      async ({ page, bjjEireCompetitionPage }) => {
        await test.step('Given BJJ Éire competitions are switched on', () => {
          givenSwitchedOn();
        });

        await test.step('When a visitor opens the page of the competition "Acceptance Closed"', async () => {
          await bjjEireCompetitionPage.goTo(closedCompetition.slug);
          await bjjEireCompetitionPage.expectName(closedCompetition.name);
        });

        await test.step("Then the competition's page has no accessibility violations", async () => {
          await expectNoWcagViolations(page);
        });
      },
    );

    // Signed-in scenarios use the `competitor` fixture: a fresh account that is deleted afterwards, with every
    // sign-up request aborted (data policy rule 5). The sign-up form is looked at, never submitted.
    test.describe('with a signed-in competitor', () => {
      test.describe('who has a complete profile', () => {
        test.use({ competitorProfile: { gender: 'MALE', belt: 'WHITE', dateOfBirth: dateOfBirthAgedOnSeededDay } });

        test(
          'competitor should find no accessibility violations on the sign-up page',
          {
            tag: ['@acceptance', '@local-sign-in'],
            annotation: squash({
              weight: 'medium',
              status: 'work in progress',
              nature: 'non functional',
              type: 'regression',
            }),
          },
          async ({ page, competitor, bjjEireCompetitionPage, competitorSignInPage, signUpPage }) => {
            await test.step('Given BJJ Éire competitions are switched on', () => {
              givenSwitchedOn();
            });

            await test.step('And a competitor has signed in with a new email and saved a complete profile', async () => {
              await competitorSignInPage.startSignedIn(competitor.session);
            });

            await test.step('When the competitor opens the sign-up for the "Acceptance Open" competition from its page', async () => {
              await bjjEireCompetitionPage.goTo(openCompetition.slug);
              await bjjEireCompetitionPage.chooseSignUp();
              // The offered division means the form has loaded, so the scan sees the form and not the loading state.
              await signUpPage.expectDivisionsOffered(SEEDED_BJJEIRE_OPEN_WHITE_BELT_MALE_DIVISIONS);
            });

            await test.step('Then the sign-up page has no accessibility violations', async () => {
              await expectNoWcagViolations(page);
            });
          },
        );
      });

      test(
        'competitor should find no accessibility violations on the profile form',
        {
          tag: ['@acceptance', '@local-sign-in'],
          annotation: squash({
            weight: 'medium',
            status: 'work in progress',
            nature: 'non functional',
            type: 'regression',
          }),
        },
        async ({ page, competitor, competitionsPage, competitorSignInPage, competitorProfilePage }) => {
          await test.step('Given BJJ Éire competitions are switched on', () => {
            givenSwitchedOn();
          });

          await test.step('And a competitor has signed in with a new email', async () => {
            await competitorSignInPage.startSignedIn(competitor.session);
          });

          await test.step('When the competitor opens their profile', async () => {
            await competitionsPage.goTo();
            await competitorProfilePage.openFromAccountLink();
            await competitorProfilePage.expectCreateFormShown();
          });

          await test.step('Then the create-profile form has no accessibility violations', async () => {
            await expectNoWcagViolations(page);
          });
        },
      );
    });
  },
);
