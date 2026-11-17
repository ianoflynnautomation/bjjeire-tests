// spec: specs/features/competitions.md
// seed: tests/agents/seed.spec.ts
import { test, competitionsTestConfig } from './fixtures';
import { SEEDED_FINISHED_COMPETITION, SEEDED_FINISHED_COMPETITORS } from './seeded';
import { squash } from '@squash/annotations';

test.use(competitionsTestConfig);

test.describe(
  'Competitions BJJ Éire competitors UI acceptance',
  { tag: ['@competitions', '@ui', '@desktop', '@squash'] },
  () => {
    test(
      "visitor should see each division's confirmed competitors with their academy and affiliation",
      {
        tag: ['@acceptance', '@bjjeire-competitions-on'],
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ bjjEireCompetitionPage }) => {
        const { white76, brown943 } = SEEDED_FINISHED_COMPETITORS;

        await test.step('When a visitor opens the page of the competition "Acceptance Finished"', async () => {
          await bjjEireCompetitionPage.goTo(SEEDED_FINISHED_COMPETITION.slug);
        });

        await test.step('Then the Gi male adult white -76 kg division is headed "4 competitors" and lists those four, Darragh Kelly with no academy', async () => {
          await bjjEireCompetitionPage.expectCompetitors(white76.heading, white76.competitors);
        });

        await test.step('And the brown -94.3 kg division is headed "1 competitor" and lists Tadhg Quinn', async () => {
          await bjjEireCompetitionPage.expectCompetitors(brown943.heading, brown943.competitors);
        });
      },
    );
  },
);
