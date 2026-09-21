import { mockBjjEvents, EVENTS_ROUTE } from './testdata/mocks';
import { EventsPage } from '@ui/pages/events/events.page';
import { test as core } from '@ui/fixtures';
import { failureMockFixtures, type FailureMocks } from '@ui/fixtures/failure.fixture';
import { mockFixture, pageFixture } from '@ui/fixtures/mock-fixture';

export type EventsUiFixtures = FailureMocks & {
  eventsPage: EventsPage;
  mockBjjEvents: (body: unknown) => Promise<void>;
};

export const test = core.extend<EventsUiFixtures>({
  eventsPage: pageFixture(EventsPage),
  mockBjjEvents: mockFixture(mockBjjEvents),
  ...failureMockFixtures(EVENTS_ROUTE),
});

/**
 * Option values every events spec runs with — each of them calls
 * `test.use(eventsTestConfig)`. Intentionally empty: the defaults suit events today.
 * Put anything the whole feature needs here (`viewport`, `colorScheme`,
 * `featureFlagOverrides`, `timezoneId`, …) and every events spec picks it up
 * without being edited. The type is derived from this feature's own `test`, so
 * it accepts the core options plus any option this file later declares.
 */
export const eventsTestConfig: Parameters<typeof test.use>[0] = {};

export { expect } from '@ui/fixtures';
