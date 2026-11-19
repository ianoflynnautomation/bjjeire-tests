// spec: specs/features/events.md
// seed: tests/agents/seed.spec.ts
import { test, eventsTestConfig } from './fixtures';
import { squash } from '@squash/annotations';

test.use(eventsTestConfig);

test.describe('Events UI acceptance: errors', { tag: ['@bjj-events', '@events', '@ui', '@desktop', '@squash'] }, () => {
  test(
    'visitor should see the events after retrying a failed load',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ mockServerErrorOnce, eventsPage }) => {
      await test.step('Given the event service is unavailable', async () => {
        await mockServerErrorOnce();
      });

      await test.step('When a visitor opens Events', async () => {
        await eventsPage.goTo();
      });

      await test.step('Then a server error message is displayed', async () => {
        await eventsPage.expectServerErrorMessage();
      });

      await test.step('When the service recovers and the visitor retries', async () => {
        await eventsPage.retryAfterError();
      });

      await test.step('Then the event list is displayed', async () => {
        await eventsPage.expectListNotEmpty();
      });
    },
  );
});
