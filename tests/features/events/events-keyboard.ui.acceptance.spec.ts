// spec: specs/features/events.md
// seed: tests/agents/seed.spec.ts
import { test, eventsTestConfig } from './fixtures';
import { BjjEventType } from '@api/features/events/events.types';
import { SEEDED_EVENT_REBEL_COUNTY_SEMINAR } from './seeded';
import { squash } from '@squash/annotations';

test.use(eventsTestConfig);

const seededSeminar = SEEDED_EVENT_REBEL_COUNTY_SEMINAR;
const seminarType = BjjEventType.Seminar;

test.describe(
  'Events UI acceptance: keyboard',
  { tag: ['@bjj-events', '@events', '@ui', '@desktop', '@squash'] },
  () => {
    test(
      'visitor should be able to filter and search events using only the keyboard',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ eventsPage }) => {
        await test.step('When a visitor opens Events', async () => {
          await eventsPage.goTo();
        });

        await test.step('And the visitor chooses Seminar using the keyboard', async () => {
          await eventsPage.filterByTypeWithKeyboard(seminarType);
        });

        await test.step('And the visitor searches for the seminar using the keyboard', async () => {
          await eventsPage.searchForWithKeyboard(seededSeminar.name);
        });

        await test.step('Then only that event is listed', async () => {
          await eventsPage.expectResultCount(1);
          await eventsPage.expectListedNames([seededSeminar.name]);
        });

        await test.step('And the type chosen is Seminar', async () => {
          await eventsPage.expectTypeChosen(seminarType);
        });
      },
    );
  },
);
