import { TIMEOUTS } from '@shared/config/timeouts';
import { test, gymsTestConfig } from './fixtures';
import { ALL_FEATURES_ENABLED } from '@ui/fixtures/feature-flags.fixture';
import { SEEDED_GYM_HARBOUR_CITY } from './seeded';
import { Theme } from '@ui/pages/sections/header.constants';
import { expectNoWcagViolations } from '@ui/support';
import { squash } from '@squash/annotations';

test.use(gymsTestConfig);
// GymsMap is off unless an environment enables it, so the map specs set it explicitly.
test.use({ featureFlagOverrides: { ...ALL_FEATURES_ENABLED, GymsMap: true } });

const harbourCity = SEEDED_GYM_HARBOUR_CITY;

test.describe('Gyms map accessibility acceptance', { tag: ['@gyms', '@a11y', '@desktop', '@squash'] }, () => {
  test.beforeEach(async ({ mockMapTiles }) => {
    await mockMapTiles();
  });

  for (const theme of Object.values(Theme)) {
    test(
      `Gyms map should have no WCAG 2.1 A/AA violations in the ${theme} theme`,
      {
        tag: '@acceptance',
        annotation: squash({
          weight: 'medium',
          status: 'work in progress',
          nature: 'non functional',
          type: 'regression',
        }),
      },
      async ({ gymsMapPage, page }) => {
        test.setTimeout(TIMEOUTS.max);

        await test.step(`Given a visitor has the map open in the ${theme} theme`, async () => {
          await gymsMapPage.chooseThemeBeforeLoad(theme);
          await gymsMapPage.goToWithQuery(`q=${encodeURIComponent(harbourCity.name)}`);
          await gymsMapPage.expectThemeApplied(theme);
          await gymsMapPage.expectPinFor(harbourCity.name);
        });

        await test.step("And the gym's pin is open and fully faded in", async () => {
          await gymsMapPage.openPinFor(harbourCity.name);
          await gymsMapPage.expectPopupFullyOpaque();
          await gymsMapPage.makeTilesReadableByAxe();
        });

        await test.step('Then no accessibility violations are found', async () => {
          await expectNoWcagViolations(page);
        });
      },
    );
  }
});
