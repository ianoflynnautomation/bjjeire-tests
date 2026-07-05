import { test } from '@ui/fixtures';
import { faker } from '@faker-js/faker';
import { eventCardFromDto } from '@ui/pages/events/events.card.mapper';
import { emptyPage } from '@ui/pages/common/empty.page';
import {
  SEEDED_EVENT_LEINSTER_OPEN_MAT,
  SEEDED_EVENT_LEINSTER_OPEN_MAT_PARTIAL_NAME,
  SEEDED_EVENT_REBEL_COUNTY_SEMINAR,
} from '../../testdata/seeded/events';

const seededEvent = SEEDED_EVENT_LEINSTER_OPEN_MAT;
const seededEventCard = eventCardFromDto(seededEvent);
const seededEventPartialName = SEEDED_EVENT_LEINSTER_OPEN_MAT_PARTIAL_NAME;
const seededSeminar = SEEDED_EVENT_REBEL_COUNTY_SEMINAR;
const seededSeminarCard = eventCardFromDto(seededSeminar);
const SEMINAR_TYPE_LABEL = 'Seminar';

test.describe('Events UI acceptance', { tag: ['@bjj-events', '@events', '@ui', '@desktop'] }, () => {
  test(
    'Given available events, when a visitor opens Events, then the event list is displayed',
    { tag: ['@smoke', '@acceptance'] },
    async ({ eventsPage }) => {
      await eventsPage.goTo();
      await eventsPage.verifyIsLoaded();
    },
  );

  test(
    'Given no matching event, when a visitor searches, then an empty state is displayed',
    { tag: '@acceptance' },
    async ({ eventsPage }) => {
      await eventsPage.goTo();
      await eventsPage.searchFor(faker.string.alphanumeric({ length: 12 }));
      await eventsPage.expectNoResults();
    },
  );

  test(
    'Given an event name, when a visitor searches, then only that event is displayed',
    { tag: '@acceptance' },
    async ({ eventsPage }) => {
      await eventsPage.goTo();
      await eventsPage.searchFor(seededEvent.name);
      await eventsPage.expectSearchValue(seededEvent.name);
      await eventsPage.expectCardData(seededEventCard);
    },
  );

  test(
    'Given part of an event name, when a visitor searches, then the matching event is displayed',
    { tag: '@acceptance' },
    async ({ eventsPage }) => {
      await eventsPage.goTo();
      await eventsPage.searchFor(seededEventPartialName);
      await eventsPage.expectSearchValue(seededEventPartialName);
      await eventsPage.expectCardData(seededEventCard);
    },
  );

  test(
    'Given an active search, when the visitor clears it, then events from the full listing are displayed again',
    { tag: '@acceptance' },
    async ({ eventsPage }) => {
      await eventsPage.goTo();
      await eventsPage.searchFor(seededEvent.name);
      await eventsPage.expectCardData(seededEventCard);
      await eventsPage.expectCardAbsent(seededSeminar.name);
      await eventsPage.clearSearch();
      await eventsPage.expectSearchValue('');
      await eventsPage.expectCardData(seededSeminarCard);
      await eventsPage.expectCardData(seededEventCard);
    },
  );

  test(
    'Given a visitor searches, when results narrow, then the header count reflects the matching events',
    { tag: '@acceptance' },
    async ({ eventsPage }) => {
      await eventsPage.goTo();
      await eventsPage.searchFor(seededEvent.name);
      await eventsPage.expectHeaderTotal('Found 1 event.');
      await eventsPage.clearSearch();
      await eventsPage.expectHeaderTotal(/^Found \d+ events\.$/);
    },
  );

  test(
    'Given events in several counties, when a visitor filters by county, then only events from that county are displayed',
    { tag: '@acceptance' },
    async ({ eventsPage }) => {
      await eventsPage.goTo();
      await eventsPage.filterByCounty(seededSeminar.county);
      await eventsPage.expectCardAbsent(seededEvent.name);
      await eventsPage.expectCardData(seededSeminarCard);
    },
  );

  test(
    'Given a county filter is applied, when the visitor resets it to all counties, then events from every county are displayed',
    { tag: '@acceptance' },
    async ({ eventsPage }) => {
      await eventsPage.goTo();
      await eventsPage.filterByCounty(seededSeminar.county);
      await eventsPage.expectCardAbsent(seededEvent.name);
      await eventsPage.resetCountyFilter();
      await eventsPage.expectCardData(seededEventCard);
      await eventsPage.expectCardData(seededSeminarCard);
    },
  );

  test(
    'Given events of several types, when a visitor filters by type, then only events of that type are displayed',
    { tag: '@acceptance' },
    async ({ eventsPage }) => {
      await eventsPage.goTo();
      await eventsPage.filterByType(SEMINAR_TYPE_LABEL);
      await eventsPage.expectCardAbsent(seededEvent.name);
      await eventsPage.expectCardData(seededSeminarCard);
    },
  );

  test(
    'Given the API returns no events, when a visitor opens Events, then the no-data message is shown',
    { tag: '@acceptance' },
    async ({ mockBjjEvents, eventsPage }) => {
      await mockBjjEvents(emptyPage);
      await eventsPage.goTo();
      await eventsPage.verifyIsLoaded();
      await eventsPage.expectEmptyStateMessage();
    },
  );

  test(
    'Given the API request fails, when a visitor opens Events, then a network error message is shown',
    { tag: '@acceptance' },
    async ({ mockNetworkError, eventsPage }) => {
      await mockNetworkError('events');
      await eventsPage.goTo();
      await eventsPage.expectNetworkErrorMessage();
    },
  );

  test(
    'Given the API returns a server error, when a visitor opens Events, then a server error message is shown',
    { tag: '@acceptance' },
    async ({ mockServerError, eventsPage }) => {
      await mockServerError('events');
      await eventsPage.goTo();
      await eventsPage.expectServerErrorMessage();
    },
  );
});
