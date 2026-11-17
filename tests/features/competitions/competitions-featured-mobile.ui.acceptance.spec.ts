// spec: specs/features/competitions.md
// seed: tests/agents/seed.spec.ts
import { test, competitionsTestConfig } from './fixtures';
import { SEEDED_FEATURED_COMPETITIONS } from './seeded';
import { squash } from '@squash/annotations';

test.use(competitionsTestConfig);

const [acceptanceOpen] = SEEDED_FEATURED_COMPETITIONS;

test.describe(
  'Competitions featured BJJ Éire UI acceptance: on a phone',
  { tag: ['@competitions', '@ui', '@mobile', '@squash'] },
  () => {
    test(
      'visitor should see the featured BJJ Éire competitions before the search box on a phone',
      {
        tag: ['@smoke', '@acceptance', '@bjjeire-competitions-on'],
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ competitionsPage }) => {
        await test.step('When the visitor opens Competitions', async () => {
          await competitionsPage.goTo();
        });

        await test.step('Then the featured BJJ Éire competition "Acceptance Open" is shown above the search box', async () => {
          await competitionsPage.expectFeaturedAboveSearch(acceptanceOpen.name);
        });
      },
    );
  },
);
