// spec: specs/features/competitions.md
// seed: tests/agents/seed.spec.ts
import { test, competitionsTestConfig } from './fixtures';
import { SEEDED_REGISTRATION_NOT_OFFERED } from './seeded';
import { readRegistrationWindow } from './seed-facts';
import { squash } from '@squash/annotations';

test.use(competitionsTestConfig);

test.describe(
  'Competitions BJJ Éire registration UI acceptance',
  { tag: ['@competitions', '@ui', '@desktop', '@squash'] },
  () => {
    for (const registration of SEEDED_REGISTRATION_NOT_OFFERED) {
      test(
        `visitor should see no sign-up when registration is ${registration.state}`,
        {
          tag: ['@acceptance', '@bjjeire-competitions-on'],
          annotation: squash({
            weight: 'medium',
            status: 'work in progress',
            nature: 'functional',
            type: 'regression',
          }),
        },
        async ({ request, bjjEireCompetitionPage }) => {
          const window =
            await test.step(`Given the seeded registration window of the competition "${registration.name}"`, () =>
              readRegistrationWindow(request, registration.slug));

          await test.step(`When a visitor opens the page of the competition "${registration.name}"`, async () => {
            await bjjEireCompetitionPage.goTo(registration.slug);
          });

          await test.step(`Then the registration status says "${registration.badge}"`, async () => {
            await bjjEireCompetitionPage.expectRegistrationStatus(registration.badge);
          });

          await test.step(`And the page states ${registration.sentenceLabel}`, async () => {
            await bjjEireCompetitionPage.expectRegistrationMessage(registration.sentence(window));
          });

          await test.step('And no sign-up link is offered', async () => {
            await bjjEireCompetitionPage.expectNoSignUpLink();
          });
        },
      );
    }
  },
);
