// spec: specs/features/events.md
// seed: tests/agents/seed.spec.ts
import { test, eventsTestConfig } from './fixtures';
import { SEEDED_EVENT_REBEL_COUNTY_SEMINAR } from './seeded';
import { expectNoSidewaysScroll } from '@ui/support';
import { squash } from '@squash/annotations';

test.use(eventsTestConfig);

const seededSeminar = SEEDED_EVENT_REBEL_COUNTY_SEMINAR;

test.describe(
  'Events UI acceptance: on a phone',
  { tag: ['@bjj-events', '@events', '@ui', '@mobile', '@squash'] },
  () => {
    test(
      'visitor should see event cards fit the screen on a phone',
      {
        tag: '@acceptance',
        annotation: squash({
          weight: 'medium',
          status: 'work in progress',
          nature: 'non functional',
          type: 'regression',
        }),
      },
      async ({ eventsPage, page }) => {
        await test.step('When a visitor opens Events on a phone', async () => {
          await eventsPage.goTo();
        });

        await test.step('And the visitor finds the seminar', async () => {
          await eventsPage.searchFor(seededSeminar.name);
        });

        await test.step('Then only that event is listed', async () => {
          await eventsPage.expectResultCount(1);
        });

        await test.step('And the event card, including its type badge, fits within the screen', async () => {
          await eventsPage.expectCardsWithinScreenWidth();
        });

        await test.step('And the page does not scroll sideways', async () => {
          await expectNoSidewaysScroll(page);
        });
      },
    );
  },
);
