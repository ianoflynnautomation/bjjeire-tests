import type { Page } from '@playwright/test';
import { bindPage, type BoundPageObject } from './bind-page';
import * as EventsPageMod from '@ui/pages/events/events.page';
import { mockBjjEvents } from '@ui/mocks/events.mock';

export type EventsPage = BoundPageObject<typeof EventsPageMod>;
export type MockBjjEvents = (body: unknown) => Promise<void>;

export async function eventsPageFixture(
  { page }: { page: Page },
  use: (eventsPage: EventsPage) => Promise<void>,
): Promise<void> {
  await use(bindPage(EventsPageMod, page));
}

export async function mockBjjEventsFixture(
  { page }: { page: Page },
  use: (mock: MockBjjEvents) => Promise<void>,
): Promise<void> {
  await use(body => mockBjjEvents(page, body));
}
