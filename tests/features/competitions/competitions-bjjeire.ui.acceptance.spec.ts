// spec: specs/features/competitions.md
// seed: tests/agents/seed.spec.ts
import { test, competitionsTestConfig } from './fixtures';
import { bjjEireCompetitionsSwitchedOnGiven } from './switched-on-ui';
import { ALL_FEATURES_ENABLED } from '@ui/fixtures/feature-flags.fixture';
import { HEADER_NAV_LINKS } from '@ui/pages/sections/header.constants';
import { gotoAppShell } from '@ui/support';
import { squash } from '@squash/annotations';

test.use(competitionsTestConfig);

test.describe('BJJ Éire competitions UI acceptance', { tag: ['@competitions', '@ui', '@desktop', '@squash'] }, () => {
  test.describe('with BJJ Éire competitions switched off in the browser', () => {
    // Pinned off in the browser, so this runs on any environment whatever the API's flag says.
    test.use({ featureFlagOverrides: { ...ALL_FEATURES_ENABLED, BjjEireCompetitions: false } });

    test(
      'visitor should see no account entry when BJJ Éire competitions are switched off',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ page, headerSection }) => {
        await test.step('When a visitor opens the site', async () => {
          await gotoAppShell(page, '/');
        });

        await test.step('Then the navigation lists Events, Gyms, Competitions, Shop and About', async () => {
          await headerSection.expectPageLinks(HEADER_NAV_LINKS.map(link => link.name));
        });

        await test.step('And the navigation has no entry with the retired name', async () => {
          await headerSection.expectNoRetiredNameEntry();
        });

        await test.step('And the navigation has no sign-in or account entry', async () => {
          await headerSection.expectNoAccountEntry();
        });
      },
    );
  });

  test.describe('with BJJ Éire competitions switched on', { tag: '@bjjeire-competitions-on' }, () => {
    const givenSwitchedOn = bjjEireCompetitionsSwitchedOnGiven();

    test(
      'visitor should see no retired-name entry in the navigation when BJJ Éire competitions are switched on',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ page, headerSection }) => {
        await test.step('Given BJJ Éire competitions are switched on', () => {
          givenSwitchedOn();
        });

        await test.step('When a visitor opens the site', async () => {
          await gotoAppShell(page, '/');
        });

        await test.step('Then the navigation lists Events, Gyms, Competitions, Shop and About', async () => {
          await headerSection.expectPageLinks(HEADER_NAV_LINKS.map(link => link.name));
        });

        await test.step('And the navigation has no entry with the retired name', async () => {
          await headerSection.expectNoRetiredNameEntry();
        });
      },
    );
  });

  test.describe(
    'with BJJ Éire competitions switched on and no organiser sign-in',
    { tag: '@bjjeire-competitions-on' },
    () => {
      const givenSwitchedOn = bjjEireCompetitionsSwitchedOnGiven();

      // True by construction: no stored sign-in, so the browser holds no organiser account whatever the environment.
      test.use({ storageState: { cookies: [], origins: [] } });

      test(
        'visitor should be asked to sign in as an organiser when opening competition management',
        {
          tag: '@acceptance',
          annotation: squash({
            weight: 'medium',
            status: 'work in progress',
            nature: 'functional',
            type: 'regression',
          }),
        },
        async ({ headerSection, bjjEireCompetitionAdminPage }) => {
          await test.step('Given BJJ Éire competitions are switched on', () => {
            givenSwitchedOn();
          });

          await test.step('When a visitor with no organiser sign-in opens competition management', async () => {
            await bjjEireCompetitionAdminPage.goTo();
          });

          await test.step('Then the organiser sign-in prompt is shown', async () => {
            await bjjEireCompetitionAdminPage.expectSignInPrompt();
          });

          await test.step('And no competition is listed', async () => {
            await bjjEireCompetitionAdminPage.expectNoCompetitionListed();
          });

          await test.step('And the navigation has no management entry', async () => {
            await headerSection.expectPageLinks(HEADER_NAV_LINKS.map(link => link.name));
          });
        },
      );
    },
  );
});
