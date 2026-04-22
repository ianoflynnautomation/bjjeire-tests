import { test as base } from '@playwright/test';
import { createEventsScreen, type EventsScreen } from './events.screen';

export type EventsFixtures = {
  eventsScreen: EventsScreen;
};

export const test = base.extend<EventsFixtures>({
  eventsScreen: async ({ page }, use) => {
    await use(createEventsScreen(page));
  },
});
