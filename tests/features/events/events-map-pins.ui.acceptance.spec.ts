// spec: specs/features/events.md
// seed: tests/agents/seed.spec.ts
import { test, eventsTestConfig } from './fixtures';
import { ALL_FEATURES_ENABLED } from '@ui/fixtures/feature-flags.fixture';
import { eventCardFromDto, mapPopupFromDtos } from '@ui/pages/events/events.card.mapper';
import type { RenderedDateRange } from '@ui/pages/events/events.dates';
import { SEEDED_EVENT_REBEL_COUNTY_SEMINAR } from './seeded';
import { squash } from '@squash/annotations';

test.use(eventsTestConfig);
// EventsMap is off unless an environment enables it, so the map specs set it explicitly.
test.use({ featureFlagOverrides: { ...ALL_FEATURES_ENABLED, EventsMap: true } });

const corkSeminar = SEEDED_EVENT_REBEL_COUNTY_SEMINAR;

test.describe(
  'Events map UI acceptance: pins',
  { tag: ['@bjj-events', '@events', '@ui', '@desktop', '@squash'] },
  () => {
    test.beforeEach(async ({ mockMapTiles }) => {
      await mockMapTiles();
    });

    test(
      "visitor should see an event's details and links when opening its pin",
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ eventsMapPage, eventsPage }) => {
        const popup = mapPopupFromDtos([corkSeminar]);
        const card = eventCardFromDto(corkSeminar);
        // Dates are seeded relative to seed time, so the card's own days are the expectation.
        let cardDays: RenderedDateRange = { start: 0, end: 0 };

        await test.step('Given a visitor is on the map', async () => {
          await eventsPage.goToWithQuery(`q=${encodeURIComponent(corkSeminar.name)}`);
          cardDays = await eventsPage.readScheduledDays(corkSeminar.name);
          await eventsMapPage.goToMapWithQuery(`q=${encodeURIComponent(corkSeminar.name)}`);
        });

        await test.step("When the visitor opens an event's pin", async () => {
          await eventsMapPage.openPin(corkSeminar.location.venue);
        });

        await test.step('Then the venue and address are shown', async () => {
          await eventsMapPage.expectPopupVenueAndAddress(popup);
        });

        await test.step("And the event's name, type and dates are shown", async () => {
          const [event] = popup.events;
          if (!event) throw new Error('The popup expectation has no event');
          await eventsMapPage.expectPopupEventShows(event, cardDays);
        });

        await test.step('And its event and directions links match its card', async () => {
          if (!card.mapUrl || !card.moreInfoUrl) throw new Error('The card expectation has no links');
          await eventsMapPage.expectPopupLinks({ directionsUrl: card.mapUrl, moreInfoUrl: card.moreInfoUrl });
        });
      },
    );
  },
);
