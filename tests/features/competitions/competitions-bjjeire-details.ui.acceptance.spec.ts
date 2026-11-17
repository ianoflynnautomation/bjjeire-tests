// spec: specs/features/competitions.md
// seed: tests/agents/seed.spec.ts
import { test, competitionsTestConfig } from './fixtures';
import { SEEDED_BJJEIRE_OPEN, SEEDED_BJJEIRE_OPEN_DIVISION_GROUPS, SEEDED_FEATURED_COMPETITIONS } from './seeded';
import { dublinDateTime } from './dublin-time';
import { readRegistrationWindow } from './seed-facts';
import { bjjEireCompetitionsSwitchedOnGiven } from './switched-on-ui';
import { squash } from '@squash/annotations';

test.use(competitionsTestConfig);

const openCompetition = SEEDED_BJJEIRE_OPEN;
const [openCard] = SEEDED_FEATURED_COMPETITIONS;

test.describe(
  'BJJ Éire competition details UI acceptance',
  { tag: ['@competitions', '@bjjeire-competitions-on', '@ui', '@desktop', '@squash'] },
  () => {
    const givenSwitchedOn = bjjEireCompetitionsSwitchedOnGiven();

    test(
      "visitor should see a BJJ Éire competition's details, fee, registration window and divisions",
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ request, bjjEireCompetitionPage }) => {
        const window = await test.step('Given BJJ Éire competitions are switched on', async () => {
          givenSwitchedOn();
          return readRegistrationWindow(request, openCompetition.slug);
        });

        await test.step('When a visitor opens the page of the competition "Acceptance Open"', async () => {
          await bjjEireCompetitionPage.goTo(openCompetition.slug);
        });

        await test.step('Then the competition day, the venue and the entry fee per division are shown', async () => {
          await bjjEireCompetitionPage.expectDetails({
            name: openCard.name,
            date: openCard.date,
            venue: openCard.venue,
            fee: openCard.fee,
          });
        });

        await test.step('And the registration window is shown in Irish time', async () => {
          await bjjEireCompetitionPage.expectRegistrationWindow(
            dublinDateTime(window.registrationOpensAt),
            dublinDateTime(window.registrationClosesAt),
          );
        });

        await test.step('And registration is shown as open', async () => {
          await bjjEireCompetitionPage.expectRegistrationStatus(openCard.status);
        });

        await test.step('And the divisions are listed in four groups by discipline and gender', async () => {
          await bjjEireCompetitionPage.expectDivisionGroups(SEEDED_BJJEIRE_OPEN_DIVISION_GROUPS);
        });
      },
    );

    test(
      'visitor should be offered to sign up when registration is open',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ bjjEireCompetitionPage }) => {
        await test.step('Given BJJ Éire competitions are switched on', () => {
          givenSwitchedOn();
        });

        await test.step('When a visitor opens the page of the competition "Acceptance Open"', async () => {
          await bjjEireCompetitionPage.goTo(openCompetition.slug);
        });

        // The sign-up is only looked at, never followed: a sign-up would take a seeded place for good.
        await test.step('Then a sign-up is offered', async () => {
          await bjjEireCompetitionPage.expectSignUpOffered();
        });

        await test.step('And the sign-up leads to the sign-up for that competition', async () => {
          await bjjEireCompetitionPage.expectSignUpLeadsToCompetition(openCompetition.slug);
        });
      },
    );

    test.describe('in a time zone far from Ireland', () => {
      test.use({ timezoneId: 'Pacific/Auckland' });

      test(
        'visitor should see registration times in Irish time when the browser is in another time zone',
        {
          tag: '@acceptance',
          annotation: squash({
            weight: 'medium',
            status: 'work in progress',
            nature: 'functional',
            type: 'regression',
          }),
        },
        async ({ request, bjjEireCompetitionPage }) => {
          const window = await test.step('Given BJJ Éire competitions are switched on', async () => {
            givenSwitchedOn();
            return readRegistrationWindow(request, openCompetition.slug);
          });

          // The browser time zone (Pacific/Auckland) is set for this describe with `test.use({ timezoneId })`.
          await test.step('When a visitor opens the page of the competition "Acceptance Open"', async () => {
            await bjjEireCompetitionPage.goTo(openCompetition.slug);
          });

          await test.step('Then the registration window shows the Irish opening and closing times', async () => {
            await bjjEireCompetitionPage.expectWindowTimes(
              dublinDateTime(window.registrationOpensAt),
              dublinDateTime(window.registrationClosesAt),
            );
          });

          await test.step('And the window is labelled as Irish time', async () => {
            await bjjEireCompetitionPage.expectWindowLabelledIrishTime();
          });
        },
      );
    });
  },
);
