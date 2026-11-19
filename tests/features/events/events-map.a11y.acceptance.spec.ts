// spec: specs/features/events.md
// seed: tests/agents/seed.spec.ts
import { TIMEOUTS } from '@shared/config/timeouts';
import { test, eventsTestConfig } from './fixtures';
import { ALL_FEATURES_ENABLED } from '@ui/fixtures/feature-flags.fixture';
import { SEEDED_EVENT_LEINSTER_OPEN_MAT } from './seeded';
import { Theme } from '@ui/pages/sections/header.constants';
import { expectNoWcagViolations } from '@ui/support';
import { squash } from '@squash/annotations';

test.use(eventsTestConfig);
// EventsMap is off unless an environment enables it, so the map specs set it explicitly.
test.use({ featureFlagOverrides: { ...ALL_FEATURES_ENABLED, EventsMap: true } });

const openMat = SEEDED_EVENT_LEINSTER_OPEN_MAT;

test.describe(
  'Events map accessibility acceptance',
  { tag: ['@bjj-events', '@events', '@a11y', '@desktop', '@squash'] },
  () => {
    test.beforeEach(async ({ mockMapTiles }) => {
      await mockMapTiles();
    });

    for (const theme of Object.values(Theme)) {
      test(
        `Events map should have no WCAG 2.1 A/AA violations in the ${theme} theme`,
        {
          tag: '@acceptance',
          annotation: squash({
            weight: 'medium',
            status: 'work in progress',
            nature: 'non functional',
            type: 'regression',
          }),
        },
        async ({ eventsMapPage, page }) => {
          test.setTimeout(TIMEOUTS.max);

          await test.step(`Given a visitor has the map open with the Leinster open mat's popup open, in the ${theme} theme`, async () => {
            await eventsMapPage.chooseThemeBeforeLoad(theme);
            await eventsMapPage.goToMapWithQuery(`q=${encodeURIComponent(openMat.name)}`);
            await eventsMapPage.expectThemeApplied(theme);
            await eventsMapPage.openPin(openMat.location.venue);
            await eventsMapPage.expectPopupFullyOpaque();
            await eventsMapPage.makeTilesReadableByAxe();
          });

          await test.step('Then no accessibility violations are found', async () => {
            await expectNoWcagViolations(page);
          });
        },
      );
    }
  },
);
