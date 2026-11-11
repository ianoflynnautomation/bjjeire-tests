// spec: specs/features/gyms.md
// seed: tests/agents/seed.spec.ts
import { test, expect, gymsTestConfig } from './fixtures';
import { County } from '@api/support';
import { ALL_FEATURES_ENABLED } from '@ui/fixtures/feature-flags.fixture';
import { SEEDED_GYM_BLACKWATER_VALLEY, SEEDED_GYM_HARBOUR_CITY, SEEDED_GYM_LIFFEY_GRAPPLING } from './seeded';
import { gymCardFromDto, gymCardLinksFromDto } from '@ui/pages/gyms/gyms.card.mapper';
import { squash } from '@squash/annotations';

test.use(gymsTestConfig);
// GymsMap is off unless an environment enables it, so the map specs set it explicitly.
test.use({ featureFlagOverrides: { ...ALL_FEATURES_ENABLED, GymsMap: true } });

const harbourCity = SEEDED_GYM_HARBOUR_CITY;
const blackwaterValley = SEEDED_GYM_BLACKWATER_VALLEY;
const corkGyms = [harbourCity, blackwaterValley];
const dublinGym = SEEDED_GYM_LIFFEY_GRAPPLING;
const corkGymCard = gymCardFromDto(SEEDED_GYM_BLACKWATER_VALLEY);

test.describe('Gyms map UI acceptance', { tag: ['@gyms', '@ui', '@desktop', '@squash'] }, () => {
  test.beforeEach(async ({ mockMapTiles }) => {
    await mockMapTiles();
  });

  test(
    'visitor should see the map with the shared county when opening a shared map link',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ gymsMapPage, gymsPage }) => {
      await test.step('When a visitor opens a shared link to the map for Cork', async () => {
        await gymsMapPage.goToWithQuery(`county=${County.Cork}`);
      });

      await test.step('Then the map is displayed and marked as the current view', async () => {
        await gymsMapPage.expectMapDisplayed();
        await gymsMapPage.expectMapIsCurrentView();
      });

      await test.step('And Cork is the chosen county', async () => {
        await gymsPage.expectCountyChosen(County.Cork);
      });

      await test.step('And the Cork gyms have pins and the Dublin gym does not', async () => {
        for (const gym of corkGyms) await gymsMapPage.expectPinFor(gym.name);
        await gymsMapPage.expectNoPinFor(dublinGym.name);
      });
    },
  );

  test(
    'visitor should see pins only for the chosen county when filtering the map by county',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ gymsMapPage }) => {
      let distanceBefore = 0;

      await test.step('Given a visitor is on the map', async () => {
        await gymsMapPage.goToMap();
        await gymsMapPage.expectCountryLevelZoom();
        for (const gym of [...corkGyms, dublinGym]) await gymsMapPage.expectPinFor(gym.name);
        distanceBefore = await gymsMapPage.pinDistance(harbourCity.name, blackwaterValley.name);
      });

      await test.step('When the visitor filters by Cork', async () => {
        await gymsMapPage.filterByCounty(County.Cork);
      });

      await test.step('Then the Cork gyms have pins and the Dublin gym does not', async () => {
        await gymsMapPage.expectNoPinFor(dublinGym.name);
        for (const gym of corkGyms) await gymsMapPage.expectPinFor(gym.name);
      });

      await test.step('And the map has moved closer to the Cork gyms', async () => {
        for (const gym of corkGyms) await gymsMapPage.expectPinInView(gym.name);
        await gymsMapPage.expectPinsFurtherApartThan(harbourCity.name, blackwaterValley.name, distanceBefore);
      });
    },
  );

  test(
    'visitor should see gyms in their real locations on the map',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ gymsMapPage }) => {
      await test.step('When a visitor opens the map of all gyms', async () => {
        await gymsMapPage.goToMap();
      });

      await test.step('Then the Dublin gym is north-east of the Cork gym, at the right angle', async () => {
        await gymsMapPage.expectPinNorthEastOf(dublinGym.name, harbourCity.name);
      });
    },
  );

  test(
    "visitor should see a gym's details and links when opening its pin",
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ gymsMapPage }) => {
      const card = gymCardFromDto(harbourCity);
      const links = gymCardLinksFromDto(harbourCity);

      await test.step('Given a visitor is on the map, narrowed to the gym by name so no neighbouring pin covers it', async () => {
        await gymsMapPage.goToWithQuery(`q=${encodeURIComponent(harbourCity.name)}`);
        await gymsMapPage.expectPinFor(harbourCity.name);
      });

      await test.step("When the visitor opens the gym's pin", async () => {
        await gymsMapPage.openPinFor(harbourCity.name);
      });

      await test.step('Then the gym name, county and address are shown', async () => {
        await gymsMapPage.expectPopupDetails({
          name: card.name,
          county: card.county,
          address: harbourCity.location.address,
        });
      });

      await test.step('And its website and directions links match its card and open safely in a new tab', async () => {
        expect(links.map).toContain('query=51.8985,-8.4706');
        await gymsMapPage.expectPopupLinks({ website: links.website, directions: links.map });
      });
    },
  );

  test(
    "visitor should see only the searched gym's pin when searching on the map",
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ gymsMapPage, gymsPage }) => {
      await test.step('Given a visitor is on the map', async () => {
        await gymsMapPage.goToMap();
        await gymsMapPage.expectPinFor(harbourCity.name);
        await gymsMapPage.expectCountryLevelZoom();
      });

      await test.step('When the visitor searches for a gym by name', async () => {
        await gymsPage.searchFor(harbourCity.name);
      });

      await test.step('Then only that gym has a pin', async () => {
        await gymsMapPage.expectOnlyPin(harbourCity.name);
      });

      await test.step('And the map has zoomed to it', async () => {
        await gymsMapPage.expectZoomedToPin(harbourCity.name);
      });
    },
  );

  test(
    'visitor should keep the pins and be offered the list when map tiles fail to load',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ gymsMapPage, gymsPage, abortMapTiles }) => {
      await test.step('Given map tiles cannot be loaded', async () => {
        await abortMapTiles();
      });

      await test.step('When a visitor opens the map for Cork', async () => {
        await gymsMapPage.goToWithQuery(`county=${County.Cork}`);
      });

      await test.step('Then a notice offers the gym list and the map stays open', async () => {
        await gymsMapPage.expectTilesFailedNotice();
        await gymsMapPage.expectMapDisplayed();
        await gymsMapPage.expectMapIsCurrentView();
      });

      await test.step("And the Cork gym's pin can still be opened", async () => {
        await gymsMapPage.openPinFor(blackwaterValley.name);
        await gymsMapPage.expectPopupName(blackwaterValley.name);
      });

      await test.step('And following the notice shows the gym list for Cork', async () => {
        await gymsMapPage.followTilesFailedListLink();
        await gymsMapPage.expectListUrlFor(County.Cork);
        await gymsMapPage.expectMapNotDisplayed();
        await gymsMapPage.expectListIsCurrentView();
        await gymsPage.expectCountyChosen(County.Cork);
        await gymsPage.expectCardData(corkGymCard);
      });
    },
  );

  test(
    'visitor should return to the gym list with Back after switching to the map',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ gymsMapPage, gymsPage }) => {
      await test.step('Given a visitor is on the gym list for Cork', async () => {
        await gymsPage.goToWithQuery(`county=${County.Cork}`);
        await gymsPage.expectCardData(corkGymCard);
      });

      await test.step('When the visitor switches to the map', async () => {
        await gymsMapPage.switchToMap();
      });

      await test.step('And the visitor goes back', async () => {
        await gymsPage.goBack();
      });

      await test.step('Then the gym list for Cork is displayed', async () => {
        await gymsMapPage.expectListUrlFor(County.Cork);
        await gymsMapPage.expectMapNotDisplayed();
        await gymsMapPage.expectListIsCurrentView();
        await gymsPage.expectCountyChosen(County.Cork);
        await gymsPage.expectCardData(corkGymCard);
        await gymsPage.expectCardAbsent(dublinGym.name);
      });
    },
  );

  test(
    'visitor should not download the map when staying on the gym list',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ gymsMapPage, gymsPage, requestedUrls }) => {
      await test.step('When a visitor opens Gyms and stays on the list', async () => {
        await gymsPage.goToWithQuery(`county=${County.Cork}`);
        await gymsPage.expectCardData(corkGymCard);
        await gymsMapPage.expectListIsCurrentView();
      });

      await test.step('Then no map code or tiles are requested', async () => {
        await gymsMapPage.expectNoMapDownloaded(requestedUrls);
      });

      await test.step('And switching to the map then requests them', async () => {
        await gymsMapPage.switchToMap();
        await gymsMapPage.expectMapCodeRequested(requestedUrls);
        await gymsMapPage.expectMapTilesRequested(requestedUrls);
      });
    },
  );
});

test.describe('Gyms map UI acceptance with the map off', { tag: ['@gyms', '@ui', '@desktop', '@squash'] }, () => {
  // Own describe, so the file-level GymsMap: true does not apply: the app applies this override last.
  test.use({ featureFlagOverrides: { ...ALL_FEATURES_ENABLED, GymsMap: false } });

  // A leaked map must still not reach live OpenStreetMap.
  test.beforeEach(async ({ mockMapTiles }) => {
    await mockMapTiles();
  });

  test(
    'visitor should see the gym list when opening a map link while the map is off',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ gymsMapPage, gymsPage }) => {
      await test.step('Given the map feature is off', async () => {
        // Set by this describe's featureFlagOverrides.
      });

      await test.step('When a visitor opens a link to the map for Cork', async () => {
        await gymsMapPage.openMapLinkWithQuery(`county=${County.Cork}`);
      });

      await test.step('Then the gym list for Cork is displayed on the Gyms page', async () => {
        await gymsPage.expectCardData(corkGymCard);
        await gymsPage.expectCountyChosen(County.Cork);
        await gymsPage.expectCardAbsent(dublinGym.name);
        await gymsMapPage.expectOnGymsPath();
        await gymsMapPage.expectMapNotDisplayed();
      });

      await test.step('And the visitor is not offered a choice of view', async () => {
        await gymsMapPage.expectViewSwitchAbsent();
      });
    },
  );
});
