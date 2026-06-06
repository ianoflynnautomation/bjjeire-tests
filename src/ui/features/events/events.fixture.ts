import { test as base } from '@playwright/test';
import { bindPage, type BoundPageObject } from '@ui/fixtures/bind-page';
import * as EventsPageMod from '@ui/pages/events/events.page';

export type EventsPage = BoundPageObject<typeof EventsPageMod>;

export const test = base.extend<{ eventsPage: EventsPage }>({
  eventsPage: async ({ page }, use) => {
    await use(bindPage(EventsPageMod, page));
  },
});
