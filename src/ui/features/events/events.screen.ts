import type { Page } from '@playwright/test';
import { createListScreen, listScreenTestIds, type ListScreen } from '@ui/support/ui';
import { readEventCard, type BjjEventCard } from './event-card.screen';

export type EventsScreen = ListScreen<BjjEventCard>;

export function createEventsScreen(page: Page): EventsScreen {
  return createListScreen<BjjEventCard>(page, {
    route: '/events',
    testIds: listScreenTestIds('events', 'event'),
    readCard: readEventCard,
  });
}
