import { mockBjjEvents } from '@ui/mocks/events.mock';
import { EventsPage } from '@ui/pages/events/events.page';
import { mockFixture, pageFixture } from './mock-fixture';

export type { EventsPage };
export type MockBjjEvents = (body: unknown) => Promise<void>;

export const eventsPageFixture = pageFixture(EventsPage);
export const mockBjjEventsFixture = mockFixture(mockBjjEvents);
