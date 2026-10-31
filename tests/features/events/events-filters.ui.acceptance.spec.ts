import { test, eventsTestConfig } from './fixtures';
import { BjjEventType } from '@api/features/events/events.types';
import { County } from '@api/support';
import { EVENT_TYPE_FILTER_LABELS } from '@ui/pages/events/events.constants';
import { eventCardFromDto } from '@ui/pages/events/events.card.mapper';
import { emptyPage } from '../common/testdata/mocks/empty-page';
import {
  SEEDED_EVENT_ATLANTIC_COAST_CAMP,
  SEEDED_EVENT_LEINSTER_OPEN_MAT,
  SEEDED_EVENT_REBEL_COUNTY_SEMINAR,
  SEEDED_EVENT_TRIBES_NO_GI_CAMP,
} from './seeded';
import { squash } from '@squash/annotations';

test.use(eventsTestConfig);

const seededEvent = SEEDED_EVENT_LEINSTER_OPEN_MAT;
const seededEventCard = eventCardFromDto(seededEvent);
const seededSeminar = SEEDED_EVENT_REBEL_COUNTY_SEMINAR;
const multiDayCamp = SEEDED_EVENT_ATLANTIC_COAST_CAMP;
const multiDayCampCard = eventCardFromDto(multiDayCamp);
const seminarType = BjjEventType.Seminar;
const seminarTypeLabel = EVENT_TYPE_FILTER_LABELS[seminarType];
const campType = BjjEventType.Camp;
const campTypeLabel = EVENT_TYPE_FILTER_LABELS[campType];
const openMatType = BjjEventType.OpenMat;
const openMatTypeLabel = EVENT_TYPE_FILTER_LABELS[openMatType];
const singleMatchSearches = [
  { field: 'address', term: seededEvent.location.address },
  { field: 'organiser', term: seededEvent.organiser.name },
] as const;

test.describe(
  'Events UI acceptance: combined filters and search',
  { tag: ['@bjj-events', '@events', '@ui', '@desktop', '@squash'] },
  () => {
    test(
      'visitor should see events of every chosen type when choosing several types',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ eventsPage }) => {
        await test.step('When a visitor opens Events', async () => {
          await eventsPage.goTo();
        });

        await test.step(`And the visitor chooses ${seminarTypeLabel} and ${campTypeLabel}`, async () => {
          await eventsPage.filterByType(seminarType);
          await eventsPage.filterByType(campType);
        });

        await test.step('Then events of either type are listed', async () => {
          await eventsPage.expectCardData({ name: seededSeminar.name });
          await eventsPage.expectCardData({ name: SEEDED_EVENT_TRIBES_NO_GI_CAMP.name });
        });

        await test.step('And events of neither type are not listed', async () => {
          await eventsPage.expectCardAbsent(seededEvent.name);
        });
      },
    );

    test(
      'visitor should see every type of event again after choosing All Types',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ eventsPage }) => {
        await test.step('When a visitor opens Events', async () => {
          await eventsPage.goTo();
        });

        await test.step(`And the visitor chooses ${seminarTypeLabel} and ${campTypeLabel}`, async () => {
          await eventsPage.filterByType(seminarType);
          await eventsPage.filterByType(campType);
        });

        await test.step('Then events of other types are not listed', async () => {
          await eventsPage.expectCardAbsent(seededEvent.name);
        });

        await test.step('When the visitor chooses All Types', async () => {
          await eventsPage.showAllTypes();
        });

        await test.step('Then the earlier type choices are cleared', async () => {
          await eventsPage.expectTypeNotChosen(seminarType);
          await eventsPage.expectTypeNotChosen(campType);
        });

        await test.step(`When the visitor searches for "${seededEvent.name}"`, async () => {
          await eventsPage.searchFor(seededEvent.name);
        });

        await test.step('Then that event is listed', async () => {
          await eventsPage.expectResultCount(1);
          await eventsPage.expectCardData(seededEventCard);
        });
      },
    );

    test(
      'visitor should find only the matching event when combining county, type and search',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ eventsPage }) => {
        await test.step('When a visitor opens Events', async () => {
          await eventsPage.goTo();
        });

        await test.step(`And the visitor filters by ${multiDayCamp.county} and ${openMatTypeLabel}`, async () => {
          await eventsPage.filterByCounty(multiDayCamp.county);
          await eventsPage.filterByType(openMatType);
        });

        await test.step(`And the visitor searches for "${multiDayCamp.name}"`, async () => {
          await eventsPage.searchFor(multiDayCamp.name);
        });

        await test.step('Then only that event is listed', async () => {
          await eventsPage.expectResultCount(1);
          await eventsPage.expectCardData(multiDayCampCard);
        });
      },
    );

    test(
      'visitor should see no results when a search matches nothing within the chosen filters',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ eventsPage }) => {
        await test.step('When a visitor opens Events', async () => {
          await eventsPage.goTo();
        });

        await test.step(`And the visitor filters by ${multiDayCamp.county}`, async () => {
          await eventsPage.filterByCounty(multiDayCamp.county);
        });

        await test.step(`And the visitor searches for "${seededEvent.name}", held in another county`, async () => {
          await eventsPage.searchFor(seededEvent.name);
        });

        await test.step('Then no events are listed', async () => {
          await eventsPage.expectNoResults();
        });
      },
    );

    test(
      'visitor should be told no events match when the chosen filters find nothing',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ mockBjjEvents, eventsPage }) => {
        await test.step('When a visitor opens Events', async () => {
          await eventsPage.goTo();
        });

        await test.step('And no events match the county the visitor will choose', async () => {
          await mockBjjEvents(emptyPage);
        });

        await test.step(`And the visitor filters by ${County.Waterford}`, async () => {
          await eventsPage.filterByCounty(County.Waterford);
        });

        await test.step('Then the visitor is told no events match the current filters', async () => {
          await eventsPage.expectEmptyStateMessage();
        });
      },
    );

    for (const { field, term } of singleMatchSearches) {
      test(
        `visitor should find an event by its ${field}`,
        {
          tag: '@acceptance',
          annotation: squash({
            weight: 'medium',
            status: 'work in progress',
            nature: 'functional',
            type: 'regression',
          }),
        },
        async ({ eventsPage }) => {
          await test.step('When a visitor opens Events', async () => {
            await eventsPage.goTo();
          });

          await test.step(`And the visitor searches for "${term}"`, async () => {
            await eventsPage.searchFor(term);
          });

          await test.step('Then only that event is listed', async () => {
            await eventsPage.expectResultCount(1);
            await eventsPage.expectCardData(seededEventCard);
          });
        },
      );
    }

    test(
      'visitor should find events by county name',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ eventsPage }) => {
        await test.step('When a visitor opens Events', async () => {
          await eventsPage.goTo();
        });

        await test.step(`And the visitor searches for "${multiDayCamp.county}"`, async () => {
          await eventsPage.searchFor(multiDayCamp.county);
        });

        await test.step(`Then events from ${multiDayCamp.county} are listed and others are not`, async () => {
          await eventsPage.expectCardData(multiDayCampCard);
          await eventsPage.expectCardAbsent(seededEvent.name);
        });
      },
    );
  },
);
