// spec: specs/features/events.md
// seed: tests/agents/seed.spec.ts
import { test, eventsTestConfig } from './fixtures';
import { ALL_FEATURES_ENABLED } from '@ui/fixtures/feature-flags.fixture';
import { SEEDED_EVENT_REBEL_COUNTY_SEMINAR } from './seeded';
import { squash } from '@squash/annotations';

test.use(eventsTestConfig);
// EventsMap is off unless an environment enables it, so the map specs set it explicitly.
test.use({ featureFlagOverrides: { ...ALL_FEATURES_ENABLED, EventsMap: true } });

const corkSeminar = SEEDED_EVENT_REBEL_COUNTY_SEMINAR;
/** Cork narrowed to the seminar by name, so it is one card whatever else the environment holds. */
const corkSeminarQuery = `county=${corkSeminar.county}&q=${encodeURIComponent(corkSeminar.name)}`;

test.describe(
  'Events map UI acceptance: tiles failed',
  { tag: ['@bjj-events', '@events', '@ui', '@desktop', '@squash'] },
  () => {
    test(
      'visitor should keep the pins and be offered the list when map tiles fail to load',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ eventsMapPage, eventsPage, abortMapTiles }) => {
        await test.step('Given map tiles cannot be loaded', async () => {
          await abortMapTiles();
        });

        await test.step('When a visitor opens the map for Cork', async () => {
          await eventsMapPage.goToMapWithQuery(corkSeminarQuery);
        });

        await test.step('Then a notice offers the event list and the map stays open', async () => {
          await eventsMapPage.expectTilesFailedNotice();
          await eventsMapPage.expectMapDisplayed();
          await eventsMapPage.expectMapIsCurrentView();
        });

        await test.step("And the Cork seminar's pin can still be opened", async () => {
          await eventsMapPage.openPin(corkSeminar.location.venue);
        });

        await test.step('When the visitor follows the notice', async () => {
          await eventsMapPage.followTilesFailedListLink();
        });

        await test.step('Then the event list for Cork is shown', async () => {
          await eventsMapPage.expectListUrlFor(corkSeminar.county);
          await eventsMapPage.expectMapNotDisplayed();
          await eventsMapPage.expectListIsCurrentView();
          await eventsPage.expectCountyChosen(corkSeminar.county);
          await eventsPage.expectCardData({ name: corkSeminar.name });
        });
      },
    );
  },
);

test.describe(
  'Events map UI acceptance: map off',
  { tag: ['@bjj-events', '@events', '@ui', '@desktop', '@squash'] },
  () => {
    // Own describe, so the file-level EventsMap: true does not apply: the app applies this override last.
    test.use({ featureFlagOverrides: { ...ALL_FEATURES_ENABLED, EventsMap: false } });

    // A leaked map must still not reach live OpenStreetMap.
    test.beforeEach(async ({ mockMapTiles }) => {
      await mockMapTiles();
    });

    test(
      'visitor should see the event list when opening a map link while the events map is off',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ eventsMapPage, eventsPage }) => {
        // The describe's featureFlagOverrides turn the events map off before the link is opened.
        await test.step('When a visitor opens a link to the map while the events map is off', async () => {
          await eventsMapPage.openMapLink(corkSeminarQuery);
        });

        await test.step('Then the event list is displayed on the Events page', async () => {
          await eventsPage.expectCardData({ name: corkSeminar.name });
        });

        await test.step('And the address stays on the Events page', async () => {
          await eventsMapPage.expectOnEventsPath();
        });

        await test.step('And no map is displayed', async () => {
          await eventsMapPage.expectMapNotDisplayed();
        });

        await test.step('And the visitor is not offered a choice of view', async () => {
          await eventsMapPage.expectViewSwitchAbsent();
        });
      },
    );
  },
);
