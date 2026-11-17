// spec: specs/features/competitions.md
// seed: tests/agents/seed.spec.ts
import { test, competitionsTestConfig } from './fixtures';
import { SEEDED_FINISHED_COMPETITION, SEEDED_ONE_COMPETITOR_PODIUM } from './seeded';
import { squash } from '@squash/annotations';

test.use(competitionsTestConfig);

test.describe(
  'Competitions BJJ Éire finished competition UI acceptance',
  { tag: ['@competitions', '@ui', '@desktop', '@squash'] },
  () => {
    test(
      "visitor should see a finished competition's page with its results and no sign-up",
      {
        tag: ['@acceptance', '@bjjeire-competitions-on'],
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ bjjEireCompetitionPage }) => {
        await test.step('When a visitor opens the page of the competition "Acceptance Finished"', async () => {
          await bjjEireCompetitionPage.goTo(SEEDED_FINISHED_COMPETITION.slug);
        });

        await test.step('Then the registration status says "Finished"', async () => {
          await bjjEireCompetitionPage.expectRegistrationStatus(SEEDED_FINISHED_COMPETITION.badge);
        });

        await test.step('And the page says the competition has finished', async () => {
          await bjjEireCompetitionPage.expectRegistrationMessage(SEEDED_FINISHED_COMPETITION.sentence);
        });

        await test.step('And no sign-up link is offered', async () => {
          await bjjEireCompetitionPage.expectNoSignUpLink();
        });

        await test.step('And its Results section shows a recorded podium', async () => {
          await bjjEireCompetitionPage.expectResultsPodiumGold(
            SEEDED_FINISHED_COMPETITION.podiumDivision,
            SEEDED_FINISHED_COMPETITION.podiumGold,
          );
        });

        await test.step('And the "No results yet" message is not shown', async () => {
          await bjjEireCompetitionPage.expectNoEmptyResultsMessage();
        });
      },
    );

    test(
      'visitor should be told a one-competitor division adds no team points',
      {
        tag: ['@acceptance', '@bjjeire-competitions-on'],
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ bjjEireCompetitionPage }) => {
        await test.step('When a visitor opens the page of the competition "Acceptance Finished"', async () => {
          await bjjEireCompetitionPage.goTo(SEEDED_FINISHED_COMPETITION.slug);
        });

        await test.step('Then the brown -94.3 kg podium shows Tadhg Quinn as gold', async () => {
          await bjjEireCompetitionPage.expectResultsPodiumGold(
            SEEDED_ONE_COMPETITOR_PODIUM.division,
            SEEDED_ONE_COMPETITOR_PODIUM.gold,
          );
        });

        await test.step('And it says only one competitor took part and no team points were added', async () => {
          await bjjEireCompetitionPage.expectPodiumNote(
            SEEDED_ONE_COMPETITOR_PODIUM.division,
            SEEDED_ONE_COMPETITOR_PODIUM.note,
          );
        });
      },
    );
  },
);
