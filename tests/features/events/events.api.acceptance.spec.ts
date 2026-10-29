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
import { squash } from '@squash/annotations';

const FULL_PAGE_SIZE = 50;
const SMALL_PAGE_SIZE = 2;

test.describe('Events API acceptance', { tag: ['@bjj-events', '@events', '@api', '@squash'] }, () => {
  test(
    'client should receive each upcoming event with its details',
    {
      tag: ['@smoke', '@acceptance'],
      annotation: squash({ weight: 'high', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ request }) => {
      const { data } = await getBjjEvents(request, bjjEventsPageSchema, {
        page: 1,
        pageSize: FULL_PAGE_SIZE,
      });

      expectListingToInclude(data, 'name', SEEDED_UPCOMING_EVENTS);
    },
  );

  test(
    'client should not receive finished events',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ request }) => {
      const { data } = await getBjjEvents(request, bjjEventsPageSchema, {
        page: 1,
        pageSize: FULL_PAGE_SIZE,
      });

      expect(data.map(event => event.name)).not.toContain(SEEDED_EVENT_FINISHED_WINTER_SOLSTICE.name);
    },
  );

  test(
    'client should receive only upcoming events from the chosen county when filtering by county',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
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
    'client should receive events ordered by creation date',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
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
    'client should receive only upcoming events of the chosen type when filtering by type',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
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
    'client should receive an event with several types when filtering by any one of them',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
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
    'client should page through the listing in distinct slices with correct links',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
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
        `client should get a bad request for ${label} "${value}"`,
        {
          tag: '@acceptance',
          annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
        },
        async ({ request }) => {
          const response = await request.get(API_ROUTES.bjjEvents, { params: { [param]: value } });

          await expectProblem(response, 400, ProblemType.BadRequest);
        },
      );
    }

    for (const { param, field, value } of OUT_OF_RANGE_PAGING_VALUES) {
      test(
        `client should get a validation error on ${param} when ${param} ${value} is out of range`,
        {
          tag: '@acceptance',
          annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
        },
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
      'client should receive the details of an upcoming event by id',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
      },
      async ({ request }) => {
        const event = await getBjjEventById(request, bjjEventSchema, SEEDED_EVENT_LEINSTER_OPEN_MAT_ID);

        expect(event).toMatchObject(SEEDED_EVENT_LEINSTER_OPEN_MAT);
      },
    );

    test(
      'client should get not found for an event id that does not exist',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
      },
      async ({ request }) => {
        const response = await request.get(resourcePath(API_ROUTES.bjjEvents, UNPUBLISHED_OBJECT_ID));

        await expectProblem(response, 404, ProblemType.NotFound);
      },
    );

    for (const { description, value } of INVALID_OBJECT_ID_VALUES) {
      test(
        `client should get a validation error on the id for an event id that is ${description}`,
        {
          tag: '@acceptance',
          annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
        },
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
