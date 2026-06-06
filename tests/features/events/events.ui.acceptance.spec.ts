import { test } from '@ui/fixtures';
import { SEEDED_EVENT_ADCC, SEEDED_EVENT_ADCC_PARTIAL } from '../../testdata/events';

test.describe('Events UI Acceptance', { tag: ['@bjj-events', '@events', '@ui', '@desktop'] }, () => {
  test('loads the events list', { tag: ['@smoke'] }, async ({ eventsPage }) => {
    await eventsPage.navigate();
    await eventsPage.verifyIsLoaded();
  });

  test('search with no match shows the empty state', { tag: '@acceptance' }, async ({ eventsPage }) => {
    await eventsPage.navigate();
    await eventsPage.searchFor('xyz');
    await eventsPage.expectNoResults();
  });

  test('search by event name shows that event only', { tag: '@acceptance' }, async ({ eventsPage }) => {
    await eventsPage.navigate();
    await eventsPage.searchFor(SEEDED_EVENT_ADCC.name);
    await eventsPage.expectSearchValue(SEEDED_EVENT_ADCC.name);
    await eventsPage.expectCardData(SEEDED_EVENT_ADCC.name, SEEDED_EVENT_ADCC);
  });

  test('search by partial event name shows that event only', { tag: '@acceptance' }, async ({ eventsPage }) => {
    await eventsPage.navigate();
    await eventsPage.searchFor(SEEDED_EVENT_ADCC_PARTIAL);
    await eventsPage.expectSearchValue(SEEDED_EVENT_ADCC_PARTIAL);
    await eventsPage.expectCardData(SEEDED_EVENT_ADCC.name, SEEDED_EVENT_ADCC);
  });
});
