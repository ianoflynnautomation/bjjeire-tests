import { test, expect } from '@api/fixtures';
import { bjjEventSchema, bjjEventsPageSchema } from '@api/features/events/events.schemas';
import { getBjjEventById, getBjjEvents } from '@api/features/events/events.service';
import { BjjEventType } from '@api/features/events/events.types';
import {
  API_ROUTES,
  County,
  expectAllFromCounty,
  expectConsecutivePagePagination,
  expectListingToInclude,
  expectPagesAreDistinct,
  expectProblem,
  expectRelativeOrder,
  ProblemType,
  resourcePath,
  ValidationErrorCode,
} from '@api/support';
import {
  INVALID_BOOLEAN_QUERY_VALUES,
  INVALID_ENUM_QUERY_VALUES,
  INVALID_INTEGER_QUERY_VALUES,
  INVALID_OBJECT_ID_VALUES,
  OUT_OF_RANGE_PAGING_VALUES,
  UNPUBLISHED_OBJECT_ID,
} from '../common/testdata/invalid-values';
import {
  SEEDED_EVENT_ATLANTIC_COAST_CAMP,
  SEEDED_EVENT_LEINSTER_OPEN_MAT,
  SEEDED_EVENT_LEINSTER_OPEN_MAT_ID,
  SEEDED_EVENT_FINISHED_WINTER_SOLSTICE,
  SEEDED_UPCOMING_EVENTS,
} from './seeded';

const FULL_PAGE_SIZE = 50;
const SMALL_PAGE_SIZE = 2;

test.describe('Events API acceptance', { tag: ['@bjj-events', '@events', '@api'] }, () => {
  test(
    'Given events are published, when a client opens the listing, then each upcoming event is returned with its details',
    { tag: ['@smoke', '@acceptance'] },
    async ({ request }) => {
      const { data } = await getBjjEvents(request, bjjEventsPageSchema, {
        page: 1,
        pageSize: FULL_PAGE_SIZE,
      });

      expectListingToInclude(data, 'name', SEEDED_UPCOMING_EVENTS);
    },
  );

  test(
    'Given an event has finished, when a client opens the listing, then it is not shown',
    { tag: '@acceptance' },
    async ({ request }) => {
      const { data } = await getBjjEvents(request, bjjEventsPageSchema, {
        page: 1,
        pageSize: FULL_PAGE_SIZE,
      });

      expect(data.map(event => event.name)).not.toContain(SEEDED_EVENT_FINISHED_WINTER_SOLSTICE.name);
    },
  );

  test(
    'Given events are published, when a client filters by county, then only upcoming events from that county are returned',
    { tag: '@acceptance' },
    async ({ request }) => {
      const county = County.Dublin;
      const dublinEvents = SEEDED_UPCOMING_EVENTS.filter(event => event.county === county);

      const { data } = await getBjjEvents(request, bjjEventsPageSchema, {
        county,
        page: 1,
        pageSize: FULL_PAGE_SIZE,
      });

      expectAllFromCounty(data, county);
      expectListingToInclude(data, 'name', dublinEvents);
      expect(data.map(event => event.name)).not.toContain(SEEDED_EVENT_FINISHED_WINTER_SOLSTICE.name);
    },
  );

  test(
    'Given several events are published, when a client opens the listing, then they are ordered by creation date',
    { tag: '@acceptance' },
    async ({ request }) => {
      const { data } = await getBjjEvents(request, bjjEventsPageSchema, {
        page: 1,
        pageSize: FULL_PAGE_SIZE,
      });

      expectRelativeOrder(
        data,
        event => event.name,
        SEEDED_UPCOMING_EVENTS.map(event => event.name),
      );
    },
  );

  test(
    'Given events are published, when a client filters by type, then only upcoming events of that type are returned',
    { tag: '@acceptance' },
    async ({ request }) => {
      const type = BjjEventType.Seminar;
      const seminarEvents = SEEDED_UPCOMING_EVENTS.filter(event => event.types.includes(type));

      const { data } = await getBjjEvents(request, bjjEventsPageSchema, {
        types: [type],
        page: 1,
        pageSize: FULL_PAGE_SIZE,
      });

      expect(data.filter(event => !event.types.includes(type))).toEqual([]);
      expectListingToInclude(data, 'name', seminarEvents);
    },
  );

  test(
    'Given an event has several types, when a client filters by any one of them, then the event is returned',
    { tag: '@acceptance' },
    async ({ request }) => {
      const multiTypeEvent = SEEDED_EVENT_ATLANTIC_COAST_CAMP;

      for (const type of multiTypeEvent.types) {
        await test.step(`Filter the listing by ${type}`, async () => {
          const { data } = await getBjjEvents(request, bjjEventsPageSchema, {
            types: [type],
            page: 1,
            pageSize: FULL_PAGE_SIZE,
          });

          expect(data.filter(event => !event.types.includes(type))).toEqual([]);
          expect(data.map(event => event.name)).toContain(multiTypeEvent.name);
        });
      }
    },
  );

  test(
    'Given the listing spans more than one page, when a client pages through it, then each page is a distinct slice with correct links',
    { tag: '@acceptance' },
    async ({ request }) => {
      const firstPage = await test.step('Request page 1 of the listing', () =>
        getBjjEvents(request, bjjEventsPageSchema, { page: 1, pageSize: SMALL_PAGE_SIZE }));

      const secondPage = await test.step('Request page 2 of the listing', () =>
        getBjjEvents(request, bjjEventsPageSchema, { page: 2, pageSize: SMALL_PAGE_SIZE }));

      expectConsecutivePagePagination(firstPage, secondPage, SMALL_PAGE_SIZE);
      expectPagesAreDistinct(firstPage, secondPage, event => event.id);
    },
  );

  test.describe('Listing query parameters', () => {
    const malformed = [
      ...INVALID_ENUM_QUERY_VALUES.map(value => ({ param: 'county', label: 'an unknown county', value })),
      ...INVALID_ENUM_QUERY_VALUES.map(value => ({ param: 'types', label: 'an unknown event type', value })),
      ...INVALID_BOOLEAN_QUERY_VALUES.map(value => ({ param: 'includeInactive', label: 'a non-boolean flag', value })),
      ...INVALID_INTEGER_QUERY_VALUES.map(value => ({ param: 'page', label: 'a non-numeric page', value })),
      ...INVALID_INTEGER_QUERY_VALUES.map(value => ({ param: 'pageSize', label: 'a non-numeric page size', value })),
    ];
    for (const { param, label, value } of malformed) {
      test(
        `Given ${label} "${value}", when a client opens the listing, then the request is rejected as a bad request`,
        { tag: '@acceptance' },
        async ({ request }) => {
          const response = await request.get(API_ROUTES.bjjEvents, { params: { [param]: value } });

          await expectProblem(response, 400, ProblemType.BadRequest);
        },
      );
    }

    for (const { param, field, value } of OUT_OF_RANGE_PAGING_VALUES) {
      test(
        `Given ${param} ${value} is out of range, when a client opens the listing, then the request fails validation on ${param}`,
        { tag: '@acceptance' },
        async ({ request }) => {
          const response = await request.get(API_ROUTES.bjjEvents, { params: { [param]: value } });

          const problem = await expectProblem(response, 400, ProblemType.Validation);
          expect(problem.errors).toContainEqual(
            expect.objectContaining({ field, errorCode: ValidationErrorCode.ValueOutOfRange }),
          );
        },
      );
    }
  });

  test.describe('Event details', () => {
    test(
      'Given an upcoming event, when a client opens it by id, then its details are returned',
      { tag: '@acceptance' },
      async ({ request }) => {
        const event = await getBjjEventById(request, bjjEventSchema, SEEDED_EVENT_LEINSTER_OPEN_MAT_ID);

        expect(event).toMatchObject(SEEDED_EVENT_LEINSTER_OPEN_MAT);
      },
    );

    test(
      'Given no event has the id, when a client opens it, then the event is not found',
      { tag: '@acceptance' },
      async ({ request }) => {
        const response = await request.get(resourcePath(API_ROUTES.bjjEvents, UNPUBLISHED_OBJECT_ID));

        await expectProblem(response, 404, ProblemType.NotFound);
      },
    );

    for (const { description, value } of INVALID_OBJECT_ID_VALUES) {
      test(
        `Given an event id that is ${description}, when a client opens it, then the request fails validation on the id`,
        { tag: '@acceptance' },
        async ({ request }) => {
          const response = await request.get(resourcePath(API_ROUTES.bjjEvents, value));

          const problem = await expectProblem(response, 400, ProblemType.Validation);
          expect(problem.errors).toContainEqual(
            expect.objectContaining({ field: 'Id', errorCode: ValidationErrorCode.InvalidFormat }),
          );
        },
      );
    }
  });
});
