import { test } from '@ui/fixtures';
import type { BjjEventCard } from '@ui/features/events/event-card.screen';
import { partialName } from '../../testdata/strings';

test.describe('Events UI Acceptance @events @ui @desktop', () => {
  test.beforeEach(({ featureFlags }) => {
    test.skip(!featureFlags.BjjEvents, "feature 'BjjEvents' disabled");
  });

  test('loads the events list @smoke @acceptance @mobile', async ({ eventsScreen }) => {
    await eventsScreen.navigate();
    await eventsScreen.verifyIsLoaded();
    await eventsScreen.expectHeaderVisible();
  });

  test('search filters the rendered events list @acceptance', async ({ eventsScreen }) => {
    await eventsScreen.navigate();
    await eventsScreen.searchFor('zzz-no-match-xyz');
    await eventsScreen.expectNoResults();
    await eventsScreen.clearSearch();
    await eventsScreen.expectAtLeastOneResult();
  });

  test('search by event name shows that event only @acceptance', async ({ eventsScreen }) => {
    const EXPECTED_BJJEVENT_CARD: BjjEventCard = {
      name: 'ADCC Irish Cup Championship 2026',
      type: '',
      county: '',
      pricing: '',
      schedule: '',
    };

    await eventsScreen.navigate();
    await eventsScreen.searchFor(EXPECTED_BJJEVENT_CARD.name);
    await eventsScreen.expectSearchValue(EXPECTED_BJJEVENT_CARD.name);
    await eventsScreen.expectCardData(EXPECTED_BJJEVENT_CARD.name, EXPECTED_BJJEVENT_CARD);
  });

  test('search by partial event name shows that event only @acceptance', async ({ eventsScreen }) => {
    const EXPECTED_BJJEVENT_CARD: BjjEventCard = {
      name: 'ADCC Irish Cup Championship 2026',
      type: '',
      county: '',
      pricing: '',
      schedule: '',
    };

    const expectedPartialName = partialName(EXPECTED_BJJEVENT_CARD.name);

    await eventsScreen.navigate();
    await eventsScreen.searchFor(expectedPartialName);
    await eventsScreen.expectSearchValue(expectedPartialName);
    await eventsScreen.expectCardData(EXPECTED_BJJEVENT_CARD.name, EXPECTED_BJJEVENT_CARD);
  });
});
