import { test, eventsTestConfig } from './fixtures';
import { faker } from '@faker-js/faker';
import { eventCardFromDto } from '@ui/pages/events/events.card.mapper';
import { emptyPage } from '../common/testdata/mocks/empty-page';
import {
  SEEDED_EVENT_LEINSTER_OPEN_MAT,
  SEEDED_EVENT_LEINSTER_OPEN_MAT_PARTIAL_NAME,
  SEEDED_EVENT_REBEL_COUNTY_SEMINAR,
} from './seeded';
import { squash } from '@squash/annotations';

test.use(eventsTestConfig);

const seededEvent = SEEDED_EVENT_LEINSTER_OPEN_MAT;
const seededEventCard = eventCardFromDto(seededEvent);
const seededEventPartialName = SEEDED_EVENT_LEINSTER_OPEN_MAT_PARTIAL_NAME;
const seededSeminar = SEEDED_EVENT_REBEL_COUNTY_SEMINAR;
const seededSeminarCard = eventCardFromDto(seededSeminar);
const SEMINAR_TYPE_LABEL = 'Seminar';

test.describe('Events UI acceptance', { tag: ['@bjj-events', '@events', '@ui', '@desktop', '@squash'] }, () => {
  test(
    'visitor should see the event list when opening Events',
    {
      tag: ['@smoke', '@acceptance'],
      annotation: squash({ weight: 'high', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ eventsPage }) => {
      await eventsPage.goTo();
      await eventsPage.verifyIsLoaded();
    },
  );

  test(
    'visitor should see an empty state when no event matches the search',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ eventsPage }) => {
      await eventsPage.goTo();
      await eventsPage.searchFor(faker.string.alphanumeric({ length: 12 }));
      await eventsPage.expectNoResults();
    },
  );

  test(
    'visitor should find only the event searched for by name',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ eventsPage }) => {
      await eventsPage.goTo();
      await eventsPage.searchFor(seededEvent.name);
      await eventsPage.expectResultCount(1);
      await eventsPage.expectCardData(seededEventCard);
    },
  );

  test(
    'visitor should find an event by part of its name',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ eventsPage }) => {
      await eventsPage.goTo();
      await eventsPage.searchFor(seededEventPartialName);
      await eventsPage.expectResultCount(1);
      await eventsPage.expectCardData(seededEventCard);
    },
  );

  test(
    'visitor should see the full event listing again after clearing the search',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ eventsPage }) => {
      await eventsPage.goTo();
      await eventsPage.searchFor(seededEvent.name);
      await eventsPage.expectResultCount(1);
      await eventsPage.expectCardAbsent(seededSeminar.name);
      await eventsPage.clearSearch();
      await eventsPage.expectSearchValue('');
      await eventsPage.expectHeaderTotal(/^Found \d+ events\.$/);
    },
  );

  test(
    'visitor should see the header count match the events a search finds',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ eventsPage }) => {
      await eventsPage.goTo();
      await eventsPage.searchFor(seededEvent.name);
      await eventsPage.expectResultCount(1);
      await eventsPage.expectHeaderTotal('Found 1 event.');
      await eventsPage.clearSearch();
      await eventsPage.expectHeaderTotal(/^Found \d+ events\.$/);
    },
  );

  test(
    'visitor should see only events from the county filtered by',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ eventsPage }) => {
      await eventsPage.goTo();
      await eventsPage.filterByCounty(seededSeminar.county);
      await eventsPage.expectCardAbsent(seededEvent.name);
      await eventsPage.expectCardData(seededSeminarCard);
    },
  );

  test(
    'visitor should see events from every county after resetting the county filter',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ eventsPage }) => {
      await eventsPage.goTo();
      await eventsPage.filterByCounty(seededSeminar.county);
      await eventsPage.expectCardAbsent(seededEvent.name);
      await eventsPage.expectCardData(seededSeminarCard);
      await eventsPage.resetCountyFilter();
      await eventsPage.searchFor(seededEvent.name);
      await eventsPage.expectResultCount(1);
      await eventsPage.expectCardData(seededEventCard);
    },
  );

  test(
    'visitor should see only events of the type filtered by',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ eventsPage }) => {
      await eventsPage.goTo();
      await eventsPage.filterByType(SEMINAR_TYPE_LABEL);
      await eventsPage.expectCardAbsent(seededEvent.name);
      await eventsPage.expectCardData(seededSeminarCard);
    },
  );

  test(
    'visitor should see the no-data message when the API returns no events',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ mockBjjEvents, eventsPage }) => {
      await mockBjjEvents(emptyPage);
      await eventsPage.goTo();
      await eventsPage.verifyIsLoaded();
      await eventsPage.expectEmptyStateMessage();
    },
  );

  test(
    'visitor should see a network error message when the events request fails',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ mockNetworkError, eventsPage }) => {
      await mockNetworkError();
      await eventsPage.goTo();
      await eventsPage.expectNetworkErrorMessage();
    },
  );

  test(
    'visitor should see a server error message when the events API returns a server error',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ mockServerError, eventsPage }) => {
      await mockServerError();
      await eventsPage.goTo();
      await eventsPage.expectServerErrorMessage();
    },
  );
});
