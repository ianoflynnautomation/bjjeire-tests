import { test, eventsTestConfig } from './fixtures';
import { BjjEventType } from '@api/features/events/events.types';
import { EVENT_TYPE_FILTER_LABELS } from '@ui/pages/events/events.constants';
import { faker } from '@faker-js/faker';
import { eventCardFromDto } from '@ui/pages/events/events.card.mapper';
import { emptyPage } from '../common/testdata/mocks/empty-page';
import {
  SEEDED_EVENT_LEINSTER_OPEN_MAT,
  SEEDED_EVENT_LEINSTER_OPEN_MAT_PARTIAL_NAME,
  SEEDED_EVENT_REBEL_COUNTY_SEMINAR,
} from './seeded';
import { squash } from '@squash/annotations';

test.use(eventsTestConfig);

const seededEvent = SEEDED_EVENT_LEINSTER_OPEN_MAT;
const seededEventCard = eventCardFromDto(seededEvent);
const seededEventPartialName = SEEDED_EVENT_LEINSTER_OPEN_MAT_PARTIAL_NAME;
const seededSeminar = SEEDED_EVENT_REBEL_COUNTY_SEMINAR;
const seededSeminarCard = eventCardFromDto(seededSeminar);
const seminarType = BjjEventType.Seminar;
const seminarTypeLabel = EVENT_TYPE_FILTER_LABELS[seminarType];

test.describe('Events UI acceptance', { tag: ['@bjj-events', '@events', '@ui', '@desktop', '@squash'] }, () => {
  test(
    'visitor should see the event list when opening Events',
    {
      tag: ['@smoke', '@acceptance'],
      annotation: squash({ weight: 'high', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ eventsPage }) => {
      await test.step('When a visitor opens Events', async () => {
        await eventsPage.goTo();
      });

      await test.step('Then the event list is displayed', async () => {
        await eventsPage.verifyIsLoaded();
      });
    },
  );

  test(
    'visitor should see an empty state when no event matches the search',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ eventsPage }) => {
      await test.step('When a visitor opens Events', async () => {
        await eventsPage.goTo();
      });

      await test.step('And the visitor searches for a name that matches nothing', async () => {
        await eventsPage.searchFor(faker.string.alphanumeric({ length: 12 }));
      });

      await test.step('Then no events are listed', async () => {
        await eventsPage.expectNoResults();
      });
    },
  );

  test(
    'visitor should find only the event searched for by name',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ eventsPage }) => {
      await test.step('When a visitor opens Events', async () => {
        await eventsPage.goTo();
      });

      await test.step(`And the visitor searches for "${seededEvent.name}"`, async () => {
        await eventsPage.searchFor(seededEvent.name);
      });

      await test.step('Then only that event is listed', async () => {
        await eventsPage.expectResultCount(1);
        await eventsPage.expectCardData(seededEventCard);
      });
    },
  );

  test(
    'visitor should find an event by part of its name',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ eventsPage }) => {
      await test.step('When a visitor opens Events', async () => {
        await eventsPage.goTo();
      });

      await test.step(`And the visitor searches for "${seededEventPartialName}"`, async () => {
        await eventsPage.searchFor(seededEventPartialName);
      });

      await test.step('Then the event matching that part of the name is listed', async () => {
        await eventsPage.expectResultCount(1);
        await eventsPage.expectCardData(seededEventCard);
      });
    },
  );

  test(
    'visitor should see the full event listing again after clearing the search',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ eventsPage }) => {
      await test.step('When a visitor opens Events', async () => {
        await eventsPage.goTo();
      });

      await test.step(`And the visitor searches for "${seededEvent.name}"`, async () => {
        await eventsPage.searchFor(seededEvent.name);
      });

      await test.step('Then only that event is listed', async () => {
        await eventsPage.expectResultCount(1);
        await eventsPage.expectCardAbsent(seededSeminar.name);
      });

      await test.step('When the visitor clears the search', async () => {
        await eventsPage.clearSearch();
      });

      await test.step('Then the full event listing is shown', async () => {
        await eventsPage.expectSearchValue('');
        await eventsPage.expectHeaderTotal(/^Found \d+ events\.$/);
      });
    },
  );

  test(
    'visitor should see the header count match the events a search finds',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ eventsPage }) => {
      await test.step('When a visitor opens Events', async () => {
        await eventsPage.goTo();
      });

      await test.step(`And the visitor searches for "${seededEvent.name}"`, async () => {
        await eventsPage.searchFor(seededEvent.name);
      });

      await test.step('Then the header count matches the one event found', async () => {
        await eventsPage.expectResultCount(1);
        await eventsPage.expectHeaderTotal('Found 1 event.');
      });

      await test.step('When the visitor clears the search', async () => {
        await eventsPage.clearSearch();
      });

      await test.step('Then the header count matches the full listing', async () => {
        await eventsPage.expectHeaderTotal(/^Found \d+ events\.$/);
      });
    },
  );

  test(
    'visitor should see only events from the chosen county when filtering by county',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ eventsPage }) => {
      await test.step('When a visitor opens Events', async () => {
        await eventsPage.goTo();
      });

      await test.step(`And the visitor filters by ${seededSeminar.county}`, async () => {
        await eventsPage.filterByCounty(seededSeminar.county);
      });

      await test.step(`Then only events from ${seededSeminar.county} are listed`, async () => {
        await eventsPage.expectOnlyCountyListed(seededSeminar.county);
        await eventsPage.expectCardAbsent(seededEvent.name);
        await eventsPage.expectCardData(seededSeminarCard);
      });
    },
  );

  test(
    'visitor should see events from every county after resetting the county filter',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ eventsPage }) => {
      await test.step('When a visitor opens Events', async () => {
        await eventsPage.goTo();
      });

      await test.step(`And the visitor filters by ${seededSeminar.county}`, async () => {
        await eventsPage.filterByCounty(seededSeminar.county);
      });

      await test.step(`Then only events from ${seededSeminar.county} are listed`, async () => {
        await eventsPage.expectOnlyCountyListed(seededSeminar.county);
        await eventsPage.expectCardAbsent(seededEvent.name);
        await eventsPage.expectCardData(seededSeminarCard);
      });

      await test.step('When the visitor resets the county filter', async () => {
        await eventsPage.resetCountyFilter();
      });

      await test.step(`And the visitor searches for "${seededEvent.name}"`, async () => {
        await eventsPage.searchFor(seededEvent.name);
      });

      await test.step('Then that event is listed', async () => {
        await eventsPage.expectResultCount(1);
        await eventsPage.expectCardData(seededEventCard);
      });
    },
  );

  test(
    'visitor should see only events of the chosen type when filtering by type',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ eventsPage }) => {
      await test.step('When a visitor opens Events', async () => {
        await eventsPage.goTo();
      });

      await test.step(`And the visitor filters by ${seminarTypeLabel}`, async () => {
        await eventsPage.filterByType(seminarType);
      });

      await test.step(`Then only ${seminarTypeLabel} events are listed`, async () => {
        await eventsPage.expectOnlyTypeListed(seminarType);
        await eventsPage.expectCardAbsent(seededEvent.name);
        await eventsPage.expectCardData(seededSeminarCard);
      });
    },
  );

  test(
    'visitor should see the no-data message when there are no events to show',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ mockBjjEvents, eventsPage }) => {
      await test.step('Given there are no events to show', async () => {
        await mockBjjEvents(emptyPage);
      });

      await test.step('When a visitor opens Events', async () => {
        await eventsPage.goTo();
      });

      await test.step('Then the no-data message is displayed', async () => {
        await eventsPage.verifyIsLoaded();
        await eventsPage.expectEmptyStateMessage();
      });
    },
  );

  test(
    'visitor should see a network error message when events cannot be loaded because the connection fails',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ mockNetworkError, eventsPage }) => {
      await test.step("Given the visitor's connection fails while events load", async () => {
        await mockNetworkError();
      });

      await test.step('When a visitor opens Events', async () => {
        await eventsPage.goTo();
      });

      await test.step('Then a network error message is displayed', async () => {
        await eventsPage.expectNetworkErrorMessage();
      });
    },
  );

  test(
    'visitor should see a server error message when events cannot be loaded because of a server problem',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ mockServerError, eventsPage }) => {
      await test.step('Given the event service is unavailable', async () => {
        await mockServerError();
      });

      await test.step('When a visitor opens Events', async () => {
        await eventsPage.goTo();
      });

      await test.step('Then a server error message is displayed', async () => {
        await eventsPage.expectServerErrorMessage();
      });
    },
  );
});
