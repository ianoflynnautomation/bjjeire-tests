import { test } from '@ui/fixtures';
import { SEEDED_EVENT_ADCC, SEEDED_EVENT_ADCC_PARTIAL } from '../../testdata/events';

test.describe('Events UI Acceptance', { tag: ['@events', '@ui', '@desktop'] }, () => {
  test.beforeEach(({ featureFlags }) => {
    test.skip(!featureFlags.BjjEvents, "feature 'BjjEvents' disabled");
  });

  test('loads the events list', { tag: ['@smoke', '@acceptance', '@mobile'] }, async ({ eventsScreen }) => {
    await eventsScreen.navigate();
    await eventsScreen.verifyIsLoaded();
    await eventsScreen.expectHeaderVisible();
  });

  test('search with no match shows the empty state', { tag: '@acceptance' }, async ({ eventsScreen }) => {
    await eventsScreen.navigate();
    await eventsScreen.searchFor('zzz-no-match-xyz');
    await eventsScreen.expectNoResults();
    await eventsScreen.clearSearch();
    await eventsScreen.expectAtLeastOneResult();
  });

  test('search by event name shows that event only', { tag: '@acceptance' }, async ({ eventsScreen }) => {
    await eventsScreen.navigate();
    await eventsScreen.searchFor(SEEDED_EVENT_ADCC.name);
    await eventsScreen.expectSearchValue(SEEDED_EVENT_ADCC.name);
    await eventsScreen.expectCardData(SEEDED_EVENT_ADCC.name, SEEDED_EVENT_ADCC);
  });

  test('search by partial event name shows that event only', { tag: '@acceptance' }, async ({ eventsScreen }) => {
    await eventsScreen.navigate();
    await eventsScreen.searchFor(SEEDED_EVENT_ADCC_PARTIAL);
    await eventsScreen.expectSearchValue(SEEDED_EVENT_ADCC_PARTIAL);
    await eventsScreen.expectCardData(SEEDED_EVENT_ADCC.name, SEEDED_EVENT_ADCC);
  });
});
