// spec: specs/features/events.md
// seed: tests/agents/seed.spec.ts
import { test, eventsTestConfig } from './fixtures';
import { DEFAULT_PAGE_SIZE } from '@api/support';
import { manyEventsInTwoCounties, pagedEventName } from './testdata/multi-page';
import { squash } from '@squash/annotations';

test.use(eventsTestConfig);

const MANY_EVENTS = 45;
const TOTAL_PAGES = Math.ceil(MANY_EVENTS / DEFAULT_PAGE_SIZE);
const pagedEvents = manyEventsInTwoCounties(MANY_EVENTS);

test.describe('Events UI acceptance: paging', { tag: ['@bjj-events', '@events', '@ui', '@desktop', '@squash'] }, () => {
  test(
    'visitor should reach the next page of events',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ mockBjjEventsPaged, eventsPage }) => {
      await test.step('Given there are 45 events, more than fit on one page', async () => {
        await mockBjjEventsPaged(pagedEvents);
      });

      await test.step('When a visitor opens Events', async () => {
        await eventsPage.goTo();
      });

      await test.step('And the visitor goes to the next page', async () => {
        await eventsPage.goToNextPage();
      });

      await test.step('Then events 21 to 40 are listed', async () => {
        await eventsPage.expectListedNames(
          pagedEvents.slice(DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE * 2).map(e => e.name),
        );
      });

      await test.step('And event 1 is not listed', async () => {
        await eventsPage.expectCardAbsent(pagedEventName(1));
      });

      await test.step('And the page indicator shows page 2 of 3', async () => {
        await eventsPage.expectOnPage(2, TOTAL_PAGES);
      });
    },
  );

  test(
    'visitor should return to the first page when changing a filter on a later page',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ mockBjjEventsPaged, eventsPage }) => {
      const corkEvents = pagedEvents.filter(e => e.county === 'Cork');

      await test.step('Given there are 45 events, 25 of them in Cork', async () => {
        await mockBjjEventsPaged(pagedEvents);
      });

      await test.step('When a visitor opens Events', async () => {
        await eventsPage.goTo();
      });

      await test.step('And the visitor goes to the next page', async () => {
        await eventsPage.goToNextPage();
      });

      await test.step('And the visitor filters by Cork', async () => {
        await eventsPage.filterByCounty('Cork');
      });

      await test.step("Then the first page of Cork's events is listed", async () => {
        await eventsPage.expectListedNames(corkEvents.slice(0, DEFAULT_PAGE_SIZE).map(e => e.name));
      });

      await test.step('And the page indicator shows page 1 of 2', async () => {
        await eventsPage.expectOnPage(1, Math.ceil(corkEvents.length / DEFAULT_PAGE_SIZE));
      });
    },
  );

  test(
    'visitor should find an event on a later page by searching',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ mockBjjEventsPaged, eventsPage }) => {
      const lastEvent = pagedEventName(MANY_EVENTS);

      await test.step('Given there are 45 events, more than fit on one page', async () => {
        await mockBjjEventsPaged(pagedEvents);
      });

      await test.step('When a visitor opens Events', async () => {
        await eventsPage.goTo();
      });

      await test.step('And the visitor searches for the name of the 45th event', async () => {
        await eventsPage.searchFor(lastEvent);
      });

      await test.step('Then only the 45th event is listed', async () => {
        await eventsPage.expectResultCount(1);
        await eventsPage.expectListedNames([pagedEventName(MANY_EVENTS)]);
      });

      await test.step('And the header count says one event was found', async () => {
        await eventsPage.expectHeaderTotal('Found 1 event.');
      });
    },
  );

  test(
    'visitor should stay on the same page of events when reloading Events',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ mockBjjEventsPaged, eventsPage }) => {
      await test.step('Given there are 45 events, more than fit on one page', async () => {
        await mockBjjEventsPaged(pagedEvents);
      });

      await test.step('When a visitor opens Events', async () => {
        await eventsPage.goTo();
      });

      await test.step('And the visitor goes to the next page', async () => {
        await eventsPage.goToNextPage();
      });

      await test.step('And the visitor reloads the page', async () => {
        await eventsPage.reload();
      });

      await test.step('Then events 21 to 40 are listed', async () => {
        await eventsPage.expectListedNames(
          pagedEvents.slice(DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE * 2).map(e => e.name),
        );
      });

      await test.step('And the page indicator shows page 2 of 3', async () => {
        await eventsPage.expectOnPage(2, TOTAL_PAGES);
      });
    },
  );
});
