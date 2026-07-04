import { test } from '@ui/fixtures';
import { EXPECTED_EVENT_ADCC_CARD, EXPECTED_EVENT_ADCC_PARTIAL } from '../../testdata/events';
import { faker } from '@faker-js/faker';
import { emptyPage } from '@ui/pages/common/empty.page';

test.describe('Events UI acceptance', { tag: ['@bjj-events', '@events', '@ui', '@desktop'] }, () => {
  test(
    'Given available events, when a visitor opens Events, then the event list is displayed',
    { tag: ['@smoke'] },
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
      await eventsPage.searchFor(EXPECTED_EVENT_ADCC_CARD.name);
      await eventsPage.expectSearchValue(EXPECTED_EVENT_ADCC_CARD.name);
      await eventsPage.expectCardData(EXPECTED_EVENT_ADCC_CARD);
    },
  );

  test(
    'Given part of an event name, when a visitor searches, then the matching event is displayed',
    { tag: '@acceptance' },
    async ({ eventsPage }) => {
      await eventsPage.goTo();
      await eventsPage.searchFor(EXPECTED_EVENT_ADCC_PARTIAL);
      await eventsPage.expectSearchValue(EXPECTED_EVENT_ADCC_PARTIAL);
      await eventsPage.expectCardData(EXPECTED_EVENT_ADCC_CARD);
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
