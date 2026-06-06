import type { Page } from '@playwright/test';
import { bindPage, type BoundPageObject } from './bind-page';
import * as EventsPageMod from '@ui/pages/events/events.page';

export type EventsPage = BoundPageObject<typeof EventsPageMod>;

export async function eventsPageFixture(
  { page }: { page: Page },
  use: (eventsPage: EventsPage) => Promise<void>,
): Promise<void> {
  await use(bindPage(EventsPageMod, page));
}
