// spec: specs/features/competitions.md
// seed: tests/agents/seed.spec.ts
import { test, competitionsTestConfig } from './fixtures';
import { SEEDED_FEATURED_COMPETITIONS } from './seeded';
import { Theme } from '@ui/pages/sections/header.constants';
import { squash } from '@squash/annotations';

test.use(competitionsTestConfig);

const [acceptanceOpen] = SEEDED_FEATURED_COMPETITIONS;
const ACCEPTANCE_OPEN_SLUG = 'acceptance-open';
const ACCEPTANCE_OPEN_DIVISIONS = 5;
const RETIRED_ADDRESSES = ['/tournaments', '/tournaments/acceptance-open', '/admin/tournaments'] as const;
const UNKNOWN_SLUG = 'no-such-competition';

test.describe(
  'Competitions BJJ Éire competition address UI acceptance',
  { tag: ['@competitions', '@ui', '@desktop', '@squash'] },
  () => {
    test(
      "visitor should open a featured BJJ Éire competition's page at its competitions address",
      {
        tag: ['@acceptance', '@bjjeire-competitions-on'],
        annotation: squash({ weight: 'high', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ competitionsPage, bjjEireCompetitionPage }) => {
        await test.step('When a visitor opens Competitions', async () => {
          await competitionsPage.goTo();
        });

        await test.step('And the visitor opens the featured Acceptance Open card', async () => {
          await competitionsPage.openFeaturedCompetition(acceptanceOpen.name);
        });

        await test.step('Then the address is the address of the Acceptance Open competition under Competitions', async () => {
          await bjjEireCompetitionPage.expectAddress(ACCEPTANCE_OPEN_SLUG);
        });

        await test.step('And the page shows its details, fee, registration window in Irish time and divisions', async () => {
          await bjjEireCompetitionPage.expectDetails(acceptanceOpen);
          await bjjEireCompetitionPage.expectRegistrationWindowInIrishTime();
          await bjjEireCompetitionPage.expectDivisions(ACCEPTANCE_OPEN_DIVISIONS);
        });
      },
    );

    test(
      'visitor should be told a competition was not found for an unknown competitions address',
      {
        tag: ['@acceptance', '@bjjeire-competitions-on'],
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ bjjEireCompetitionPage }) => {
        await test.step('When a visitor opens a competitions address no competition has', async () => {
          await bjjEireCompetitionPage.goToUnknownAddress(UNKNOWN_SLUG);
        });

        await test.step('Then the page says "Competition not found"', async () => {
          await bjjEireCompetitionPage.expectNotFound();
        });

        await test.step('And its link leads back to Competitions', async () => {
          await bjjEireCompetitionPage.expectBackLinkToList();
        });
      },
    );

    test(
      'visitor should keep their theme when opening a BJJ Éire competition',
      {
        tag: ['@acceptance', '@bjjeire-competitions-on'],
        annotation: squash({ weight: 'low', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ competitionsPage, headerSection }) => {
        await test.step('Given a visitor who has chosen competition mode', async () => {
          await competitionsPage.goTo();
          await headerSection.switchTheme(Theme.Competition);
        });

        await test.step('When the visitor opens Competitions', async () => {
          await competitionsPage.goTo();
        });

        await test.step('And the visitor opens the featured "Acceptance Open" card', async () => {
          await competitionsPage.openFeaturedCompetition(acceptanceOpen.name);
        });

        await test.step('Then the competition mode is still on', async () => {
          await headerSection.expectTheme(Theme.Competition);
        });
      },
    );

    for (const address of RETIRED_ADDRESSES) {
      test(
        `visitor should land on the default page when opening a retired address "${address}"`,
        {
          tag: ['@acceptance', '@bjjeire-competitions-on'],
          annotation: squash({
            weight: 'medium',
            status: 'work in progress',
            nature: 'functional',
            type: 'regression',
          }),
        },
        async ({ bjjEireCompetitionPage }) => {
          await test.step(`When a visitor opens ${address}`, async () => {
            await bjjEireCompetitionPage.goToRetiredAddress(address);
          });

          await test.step('Then they land on the Events page', async () => {
            await bjjEireCompetitionPage.expectDefaultPageShown();
          });
        },
      );
    }
  },
);
