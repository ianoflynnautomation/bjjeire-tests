import { test } from '@ui/fixtures';
import type { BjjEventCard } from '@ui/features/events/event-card.screen';

function partialName(name: string): string {
  return name.slice(0, Math.max(3, Math.min(12, name.length)));
}

test.describe('Events @events @desktop', () => {
  test.beforeEach(({ featureFlags }) => {
    test.skip(!featureFlags.BjjEvents, "feature 'BjjEvents' disabled");
  });

  test('loads the events list @smoke @mobile', async ({ eventsScreen }) => {
    await eventsScreen.navigate();
    await eventsScreen.verifyIsLoaded();
    await eventsScreen.expectHeaderVisible();
  });

  test('search filters the rendered events list @regression', async ({ eventsScreen }) => {
    await eventsScreen.navigate();
    await eventsScreen.searchFor('zzz-no-match-xyz');
    await eventsScreen.expectNoResults();
    await eventsScreen.clearSearch();
    await eventsScreen.expectAtLeastOneResult();
  });

  test('search by event name shows that event only @regression', async ({ eventsScreen }) => {
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

  test('search by partial event name shows that event only @regression', async ({ eventsScreen }) => {
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
