// spec: specs/features/gyms.md
// seed: tests/agents/seed.spec.ts
import { expect, test, gymsTestConfig } from './fixtures';
import gymsFixture from './testdata/gyms.page-1.json';
import { SEEDED_GYM_HARBOUR_CITY } from './seeded';
import { ALL_FEATURES_ENABLED } from '@ui/fixtures/feature-flags.fixture';
import { squash } from '@squash/annotations';

test.use(gymsTestConfig);

test.describe('Gyms snapshot acceptance', { tag: ['@gyms', '@snapshot', '@desktop', '@squash'] }, () => {
  // The list view is the subject here. Pinning the map off keeps the baselines the same
  // whether or not an environment enables it.
  test.use({ featureFlagOverrides: { ...ALL_FEATURES_ENABLED, GymsMap: false } });

  test.beforeEach(async ({ mockGyms }) => {
    await mockGyms(gymsFixture);
  });

  test(
    'Gyms page header should match the approved image',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'non functional', type: 'regression' }),
    },
    async ({ gymsPage }) => {
      await gymsPage.goTo();
      await gymsPage.verifyIsLoaded();
      await expect(gymsPage.header).toHaveScreenshot('gyms-header.png');
    },
  );

  test(
    'Gyms empty state should keep its accessible structure',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'non functional', type: 'regression' }),
    },
    async ({ gymsPage }) => {
      await gymsPage.goTo();
      await gymsPage.searchFor('zzz-no-match-xyz');
      await gymsPage.expectNoResults();
      await expect(gymsPage.emptyState).toMatchAriaSnapshot({ name: 'gyms-empty-state.aria.yml' });
    },
  );
});

// Structure only: no screenshot of the map. Tiles, pin pixels and Leaflet's own markup would make
// an image or a whole-map snapshot churn without finding anything. The app repo's browser tests
// own the map's visual checks (focus rings and pin contrast, measured in pixels).
test.describe('Gyms map snapshot acceptance', { tag: ['@gyms', '@snapshot', '@desktop', '@squash'] }, () => {
  test.use({ featureFlagOverrides: { ...ALL_FEATURES_ENABLED, GymsMap: true } });

  test.beforeEach(async ({ mockGymDirectory, mockMapTiles }) => {
    await mockMapTiles();
    await mockGymDirectory([SEEDED_GYM_HARBOUR_CITY]);
  });

  test(
    'Gyms map popup should keep its accessible structure',
    {
      tag: '@acceptance',
      annotation: squash({
        weight: 'medium',
        status: 'work in progress',
        nature: 'non functional',
        type: 'regression',
      }),
    },
    async ({ gymsMapPage }) => {
      await gymsMapPage.goToMap();
      await gymsMapPage.openPinFor(SEEDED_GYM_HARBOUR_CITY.name);
      await expect(gymsMapPage.popup).toMatchAriaSnapshot({ name: 'gyms-map-popup.aria.yml' });
    },
  );
});
