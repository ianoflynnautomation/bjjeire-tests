import { test } from '@ui/fixtures';
import * as EventsPage from '@ui/features/events/events.page';
import { SEEDED_EVENT_ADCC, SEEDED_EVENT_ADCC_PARTIAL } from '../../testdata/events';
import { NO_MATCH_SEARCH_TERM } from '../../testdata/strings';

test.describe('Events UI Acceptance', { tag: ['@bjj-events', '@events', '@ui', '@desktop'] }, () => {
  test('loads the events list', { tag: ['@smoke', '@acceptance', '@mobile'] }, async () => {
    await EventsPage.navigate();
    await EventsPage.verifyIsLoaded();
    await EventsPage.expectHeaderVisible();
  });

  test('search with no match shows the empty state', { tag: '@acceptance' }, async () => {
    await EventsPage.navigate();
    await EventsPage.searchFor(NO_MATCH_SEARCH_TERM);
    await EventsPage.expectNoResults();
    await EventsPage.clearSearch();
    await EventsPage.expectAtLeastOneResult();
  });

  test('search by event name shows that event only', { tag: '@acceptance' }, async () => {
    await EventsPage.navigate();
    await EventsPage.searchFor(SEEDED_EVENT_ADCC.name);
    await EventsPage.expectSearchValue(SEEDED_EVENT_ADCC.name);
    await EventsPage.expectCardData(SEEDED_EVENT_ADCC.name, SEEDED_EVENT_ADCC);
  });

  test('search by partial event name shows that event only', { tag: '@acceptance' }, async () => {
    await EventsPage.navigate();
    await EventsPage.searchFor(SEEDED_EVENT_ADCC_PARTIAL);
    await EventsPage.expectSearchValue(SEEDED_EVENT_ADCC_PARTIAL);
    await EventsPage.expectCardData(SEEDED_EVENT_ADCC.name, SEEDED_EVENT_ADCC);
  });
});
