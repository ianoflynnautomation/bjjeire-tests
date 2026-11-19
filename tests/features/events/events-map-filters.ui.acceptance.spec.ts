// spec: specs/features/events.md
// seed: tests/agents/seed.spec.ts
import { test, eventsTestConfig } from './fixtures';
import { BjjEventType } from '@api/features/events/events.types';
import { ALL_FEATURES_ENABLED } from '@ui/fixtures/feature-flags.fixture';
import {
  SEEDED_EVENT_DUBLIN_NO_GI_SEMINAR,
  SEEDED_EVENT_REBEL_COUNTY_SEMINAR,
  SEEDED_EVENT_TRIBES_NO_GI_CAMP,
} from './seeded';
import { squash } from '@squash/annotations';

test.use(eventsTestConfig);
// EventsMap is off unless an environment enables it, so the map specs set it explicitly.
test.use({ featureFlagOverrides: { ...ALL_FEATURES_ENABLED, EventsMap: true } });

const corkSeminar = SEEDED_EVENT_REBEL_COUNTY_SEMINAR;
const galwayCamp = SEEDED_EVENT_TRIBES_NO_GI_CAMP;
const dublinSeminar = SEEDED_EVENT_DUBLIN_NO_GI_SEMINAR;

test.describe(
  'Events map UI acceptance: filters',
  { tag: ['@bjj-events', '@events', '@ui', '@desktop', '@squash'] },
  () => {
    test.beforeEach(async ({ mockMapTiles }) => {
      await mockMapTiles();
    });

    test(
      'visitor should see the map with the shared filters when opening a shared map link',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ eventsMapPage, eventsPage }) => {
        await test.step('When a visitor opens a shared link to the map for Cork and seminars', async () => {
          await eventsMapPage.goToMapWithQuery(`county=${corkSeminar.county}&types=${BjjEventType.Seminar}`);
        });

        await test.step('Then the map is displayed and marked as the current view', async () => {
          await eventsMapPage.expectMapDisplayed();
          await eventsMapPage.expectMapIsCurrentView();
        });

        await test.step('And Cork and Seminar are chosen', async () => {
          await eventsPage.expectCountyChosen(corkSeminar.county);
          await eventsPage.expectTypeChosen(BjjEventType.Seminar);
        });

        await test.step('And the Cork seminar has a pin and the Dublin events do not', async () => {
          await eventsMapPage.expectPinFor(corkSeminar.location.venue);
          await eventsMapPage.expectNoPinFor(dublinSeminar.location.venue);
        });
      },
    );

    test(
      'visitor should see pins only for the chosen county when filtering the map by county',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ eventsMapPage }) => {
        let zoomBefore = 0;

        await test.step('Given a visitor is on the map of seminars', async () => {
          await eventsMapPage.goToMapWithQuery(`types=${BjjEventType.Seminar}`);
          await eventsMapPage.expectPinFor(corkSeminar.location.venue);
          await eventsMapPage.expectPinFor(dublinSeminar.location.venue);
          zoomBefore = await eventsMapPage.settledTileZoom();
        });

        await test.step('When the visitor filters by Cork', async () => {
          await eventsMapPage.filterByCounty(corkSeminar.county);
        });

        await test.step('Then the Cork seminar has a pin and the Dublin No-Gi Seminar does not', async () => {
          await eventsMapPage.expectPinFor(corkSeminar.location.venue);
          await eventsMapPage.expectNoPinFor(dublinSeminar.location.venue);
        });

        await test.step('And the map has moved closer to Cork', async () => {
          await eventsMapPage.expectZoomedInOnPin(zoomBefore, corkSeminar.location.venue);
        });
      },
    );

    test(
      'visitor should see pins only for the chosen type when filtering the map by type',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ eventsMapPage }) => {
        await test.step('Given a visitor is on the map', async () => {
          await eventsMapPage.goToMap();
          await eventsMapPage.expectPinFor(corkSeminar.location.venue);
        });

        await test.step('When the visitor filters by Camp', async () => {
          await eventsMapPage.filterByType(BjjEventType.Camp);
        });

        await test.step('Then the Galway camp has a pin and the Cork seminar does not', async () => {
          await eventsMapPage.expectPinFor(galwayCamp.location.venue);
          await eventsMapPage.expectNoPinFor(corkSeminar.location.venue);
        });
      },
    );

    test(
      "visitor should see only the searched event's pin when searching on the map",
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ eventsMapPage, eventsPage }) => {
        let zoomBefore = 0;

        await test.step('Given a visitor is on the map of seminars', async () => {
          await eventsMapPage.goToMapWithQuery(`types=${BjjEventType.Seminar}`);
          await eventsMapPage.expectPinFor(corkSeminar.location.venue);
          await eventsMapPage.expectPinFor(dublinSeminar.location.venue);
          zoomBefore = await eventsMapPage.settledTileZoom();
        });

        await test.step('When the visitor searches for an event by name', async () => {
          await eventsPage.searchFor(corkSeminar.name);
        });

        await test.step('Then only that event has a pin', async () => {
          await eventsMapPage.expectOnlyPin(corkSeminar.location.venue);
        });

        await test.step('And the map has zoomed to it', async () => {
          await eventsMapPage.expectZoomedInOnPin(zoomBefore, corkSeminar.location.venue);
        });
      },
    );
  },
);
