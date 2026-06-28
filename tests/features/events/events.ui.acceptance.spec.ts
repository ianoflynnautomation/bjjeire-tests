import { expect, test } from '@ui/fixtures';
import { EXPECTED_EVENT_ADCC_CARD, EXPECTED_EVENT_ADCC_PARTIAL } from '../../testdata/events';
import { faker } from '@faker-js/faker';
import { emptyPage, NO_DATA } from '@ui/pages/common/empty.page';
import { ERROR, ERROR_TITLE, NETWORK_ERROR_MESSAGE, SERVER_ERROR_MESSAGE } from '@ui/pages/common/error.page';

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
    { tag: ['@events', '@acceptance'] },
    async ({ page, mockBjjEvents, eventsPage }) => {
      await mockBjjEvents(emptyPage);
      await eventsPage.goTo();
      await eventsPage.verifyIsLoaded();
      await expect(page.getByTestId(NO_DATA.title)).toHaveText('No Events Found');
      await expect(page.getByTestId(NO_DATA.messageLine1)).toHaveText('No events match your current filters.');
      await expect(page.getByTestId(NO_DATA.messageLine2)).toHaveText('Try a different filter to find events.');
    },
  );

  test(
    'Given the API request fails, when a visitor opens Events, then a network error message is shown',
    { tag: ['@events', '@acceptance'] },
    async ({ page, mockNetworkError, eventsPage }) => {
      await mockNetworkError('events');
      await eventsPage.goTo();
      await expect(page.getByTestId(ERROR.title)).toHaveText(ERROR_TITLE);
      await expect(page.getByTestId(ERROR.messageLine1)).toHaveText(NETWORK_ERROR_MESSAGE);
    },
  );

  test(
    'Given the API returns a server error, when a visitor opens Events, then a server error message is shown',
    { tag: ['@events', '@acceptance'] },
    async ({ page, mockServerError, eventsPage }) => {
      await mockServerError('events');
      await eventsPage.goTo();
      await expect(page.getByTestId(ERROR.title)).toHaveText(ERROR_TITLE);
      await expect(page.getByTestId(ERROR.messageLine1)).toHaveText(SERVER_ERROR_MESSAGE);
    },
  );
});
