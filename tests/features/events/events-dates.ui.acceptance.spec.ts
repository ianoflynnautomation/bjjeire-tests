import { test, eventsTestConfig } from './fixtures';
import { ScheduleKind, type BjjEventDto } from '@api/features/events/events.types';
import { API_ROUTES, DEFAULT_PAGE_SIZE, type PaginatedResponse } from '@api/support';
import { paginatePages } from '@ui/mocks/paginate.mock';
import { SEEDED_EVENT_LEINSTER_OPEN_MAT } from './seeded';
import { squash } from '@squash/annotations';

test.use({ ...eventsTestConfig, timezoneId: 'Asia/Tokyo' });

const eventOnOneDay: BjjEventDto = {
  ...SEEDED_EVENT_LEINSTER_OPEN_MAT,
  schedule: {
    kind: ScheduleKind.FixedDates,
    startDate: '2026-11-25T15:42:10Z',
    endDate: '2026-11-25T15:42:10Z',
    sessions: [],
  },
};
const pageOf = (event: BjjEventDto): PaginatedResponse<BjjEventDto> => {
  const page = paginatePages([event], DEFAULT_PAGE_SIZE, API_ROUTES.bjjEvents)[1];
  if (!page) throw new Error('no first page');
  return page;
};

test.describe('Events UI acceptance: dates', { tag: ['@bjj-events', '@events', '@ui', '@desktop', '@squash'] }, () => {
  test(
    "visitor should see an event's date in Irish time wherever they are",
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ mockBjjEvents, eventsPage }) => {
      await test.step('Given an event on one day in Ireland', async () => {
        await mockBjjEvents(pageOf(eventOnOneDay));
      });

      await test.step('When a visitor ahead of Ireland opens Events', async () => {
        await eventsPage.goTo();
      });

      await test.step('Then its date is the date of the event in Ireland', async () => {
        await eventsPage.expectCardData({ name: eventOnOneDay.name, schedule: '25 November 2026' });
      });
    },
  );
});
