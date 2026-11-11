// spec: specs/features/events.md
// seed: tests/agents/seed.spec.ts
import { test, expect, eventsTestConfig } from './fixtures';
import { BjjEventType } from '@api/features/events/events.types';
import { faker } from '@faker-js/faker';
import { MAP_EVENT_LIMIT } from '@ui/pages/events/events.constants';
import { firstPageOfManyEvents } from './testdata/multi-page';
import { listingWithoutCoordinates, pinsFor } from './testdata/unmapped-location';
import { ALL_FEATURES_ENABLED } from '@ui/fixtures/feature-flags.fixture';
import {
  SEEDED_EVENT_ATLANTIC_COAST_CAMP,
  SEEDED_EVENT_REBEL_COUNTY_SEMINAR,
  SEEDED_EVENT_TRIBES_NO_GI_CAMP,
} from './seeded';
import { expectNoSidewaysScroll } from '@ui/support';
import { seededMapViews } from './testdata/map-views';
import { mapPopupFromDtos } from '@ui/pages/events/events.card.mapper';
import { seededDateProblems } from './testdata/seeded-dates';
import { squash } from '@squash/annotations';

test.use(eventsTestConfig);
// EventsMap is off unless an environment enables it, so the map specs set it explicitly.
test.use({ featureFlagOverrides: { ...ALL_FEATURES_ENABLED, EventsMap: true } });

/** Events beyond the map's limit that match in the truncation scenario. */
const EVENTS_OVER_MAP_LIMIT = 30;
const MATCHING_EVENTS = MAP_EVENT_LIMIT + EVENTS_OVER_MAP_LIMIT;
const corkSeminar = SEEDED_EVENT_REBEL_COUNTY_SEMINAR;
const galwayCamp = SEEDED_EVENT_TRIBES_NO_GI_CAMP;
const westportCamp = SEEDED_EVENT_ATLANTIC_COAST_CAMP;

test.describe('Events map UI acceptance', { tag: ['@bjj-events', '@events', '@ui', '@desktop', '@squash'] }, () => {
  test.beforeEach(async ({ mockMapTiles }) => {
    await mockMapTiles();
  });

  test(
    'visitor should see pins for the current results when switching from the event list to the map',
    {
      tag: ['@smoke', '@acceptance'],
      annotation: squash({ weight: 'high', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ eventsPage, eventsMapPage }) => {
      await test.step('Given a visitor has opened the event list for camps', async () => {
        await eventsPage.goTo();
        await eventsPage.filterByType(BjjEventType.Camp);
      });

      await test.step('When the visitor switches to the map', async () => {
        await eventsMapPage.switchToMap();
      });

      await test.step('Then the map is displayed and marked as the current view', async () => {
        await eventsMapPage.expectMapDisplayed();
        await eventsMapPage.expectMapIsCurrentView();
      });

      await test.step('And the Galway and Westport camps have pins and the Cork seminar does not', async () => {
        await eventsMapPage.expectPinFor(galwayCamp.location.venue);
        await eventsMapPage.expectPinFor(westportCamp.location.venue);
        await eventsMapPage.expectNoPinFor(corkSeminar.location.venue);
      });

      await test.step('And the Galway pin is south-east of the Westport pin', async () => {
        await eventsMapPage.expectPinSouthEastOf(galwayCamp.location.venue, westportCamp.location.venue);
      });
    },
  );

  test(
    'visitor should keep the search, county and type when switching from the map back to the list',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ eventsPage, eventsMapPage }) => {
      await test.step('Given a visitor is on the map filtered by Cork and Seminar', async () => {
        await eventsMapPage.goToMap();
        await eventsMapPage.filterByCounty(corkSeminar.county);
        await eventsMapPage.filterByType(BjjEventType.Seminar);
        await eventsPage.searchFor(corkSeminar.name);
      });

      await test.step('When the visitor switches to the list', async () => {
        await eventsMapPage.switchToList();
      });

      await test.step('Then the search, Cork and Seminar are still chosen', async () => {
        await eventsPage.expectSearchValue(corkSeminar.name);
        await eventsPage.expectCountyChosen(corkSeminar.county);
        await eventsPage.expectTypeChosen(BjjEventType.Seminar);
      });

      await test.step('And only the Cork seminar is listed', async () => {
        await eventsPage.expectResultCount(1);
        await eventsPage.expectCardData({ name: corkSeminar.name });
      });
    },
  );

  test(
    "visitor should see each venue's events when opening its pin on the map",
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ eventsMapPage }) => {
      for (const view of seededMapViews()) {
        // Narrowed, so the venues are on the map whatever else the environment holds.
        await test.step(`Given a visitor is on the map for ${view.label}`, async () => {
          await eventsMapPage.goToMapWithQuery(view.query);
        });

        for (const pin of view.pins) {
          await test.step(`When the visitor opens the pin for ${pin.venue}`, async () => {
            await eventsMapPage.openPin(pin.venue, pin.eventCount);
          });

          await test.step(`Then its popup shows the events at ${pin.venue}`, async () => {
            await eventsMapPage.expectPopupFor(mapPopupFromDtos(pin.events));
          });

          await test.step(`When the visitor closes the popup for ${pin.venue}`, async () => {
            await eventsMapPage.closePopupNotingDates();
          });
        }
      }

      await test.step('Then the popups show the events as many days long and as far apart as seeded', () => {
        expect(seededDateProblems(eventsMapPage.datesShownInPopups)).toEqual([]);
      });
    },
  );

  test(
    'visitor should see the empty-search message when a search matches nothing on the map',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ eventsPage, eventsMapPage }) => {
      await test.step('Given a visitor is on the map', async () => {
        await eventsMapPage.goToMap();
      });

      await test.step('When the visitor searches for text no event contains', async () => {
        await eventsPage.searchFor(faker.string.alphanumeric({ length: 12 }));
      });

      await test.step('Then the same no-results message as the list is displayed', async () => {
        await eventsPage.expectNoResults();
        await eventsMapPage.expectMapIsCurrentView();
      });
    },
  );

  test(
    'visitor should see an error message and be able to retry when events cannot be loaded on the map',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ eventsPage, eventsMapPage, mockServerErrorOnce }) => {
      await test.step('Given the event service is unavailable', async () => {
        await mockServerErrorOnce();
      });

      await test.step('When a visitor opens the map for Cork', async () => {
        await eventsMapPage.openMapLink(`county=${corkSeminar.county}`);
      });

      await test.step('Then the same server error message as the list is displayed', async () => {
        await eventsPage.expectServerErrorMessage();
      });

      await test.step('When the service recovers and the visitor retries', async () => {
        await eventsPage.retryAfterError();
      });

      await test.step("Then the map shows the Cork seminar's pin", async () => {
        await eventsMapPage.expectMapDisplayed();
        await eventsMapPage.expectPinFor(corkSeminar.location.venue);
      });
    },
  );

  test(
    'visitor should be told how many events are not shown when some have no usable location',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ eventsPage, eventsMapPage, mockBjjEvents }) => {
      const unmapped = SEEDED_EVENT_TRIBES_NO_GI_CAMP;
      const { body: listing, mapped } = listingWithoutCoordinates([unmapped]);

      await test.step('Given one event has no usable coordinates', async () => {
        await mockBjjEvents(listing);
      });

      await test.step('When a visitor opens the map', async () => {
        await eventsMapPage.goToMap();
      });

      await test.step('Then a notice says one event is not shown', async () => {
        await eventsMapPage.expectUnmappedNotice(1);
      });

      await test.step('And the other events have pins', async () => {
        await eventsMapPage.expectPinsFor(pinsFor(mapped));
        await eventsMapPage.expectNoPinFor(unmapped.location.venue);
      });

      await test.step('And the event is still listed after switching to the list', async () => {
        await eventsMapPage.switchToList();
        await eventsPage.expectCardData({ name: unmapped.name });
      });
    },
  );

  test(
    'visitor should be told to filter when more events match than the map can show',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ eventsPage, eventsMapPage, mockBjjEvents }) => {
      await test.step(`Given ${MATCHING_EVENTS} events match, more than the map can show`, async () => {
        await mockBjjEvents(firstPageOfManyEvents(MATCHING_EVENTS, MAP_EVENT_LIMIT));
      });

      await test.step('When a visitor opens the map', async () => {
        await eventsMapPage.goToMap();
      });

      await test.step('Then a notice says not every event is shown and suggests filtering', async () => {
        await eventsMapPage.expectTruncatedNotice();
      });

      await test.step('And the header count shows the number of matching events', async () => {
        await eventsPage.expectHeaderTotal(`Found ${MATCHING_EVENTS} events.`);
      });
    },
  );

  test(
    'visitor should switch between list and map using only the keyboard',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ eventsPage, eventsMapPage }) => {
      await test.step('When a visitor opens Events for Cork', async () => {
        await eventsPage.goToWithQuery(`county=${corkSeminar.county}`);
        await eventsPage.waitForResults();
      });

      await test.step('And the visitor chooses the map view using the keyboard', async () => {
        await eventsMapPage.chooseMapViewWithKeyboard();
      });

      await test.step('Then the map is marked as the current view', async () => {
        await eventsMapPage.expectMapIsCurrentView();
      });

      await test.step("When the visitor opens the Cork seminar's pin using the keyboard", async () => {
        await eventsMapPage.openPinWithKeyboard(corkSeminar.location.venue);
      });

      await test.step('Then its details are shown', async () => {
        await eventsMapPage.expectPopupFor(mapPopupFromDtos([corkSeminar]));
      });

      await test.step('When the visitor chooses the list view using the keyboard', async () => {
        await eventsMapPage.chooseListViewWithKeyboard();
      });

      await test.step('Then the list is marked as the current view', async () => {
        await eventsMapPage.expectListIsCurrentView();
      });
    },
  );
});

test.describe(
  'Events map UI acceptance: on a phone',
  { tag: ['@bjj-events', '@events', '@ui', '@mobile', '@squash'] },
  () => {
    test.beforeEach(async ({ mockMapTiles }) => {
      await mockMapTiles();
    });

    test(
      'visitor should see the map fit the screen on a phone',
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
        await test.step('When a visitor opens the map on a phone', async () => {
          await eventsMapPage.goToMap();
        });

        await test.step('Then the map fits within the screen', async () => {
          await eventsMapPage.expectMapWithinScreenWidth();
        });

        await test.step('And the page does not scroll sideways', async () => {
          await expectNoSidewaysScroll(page);
        });
      },
    );
  },
);
