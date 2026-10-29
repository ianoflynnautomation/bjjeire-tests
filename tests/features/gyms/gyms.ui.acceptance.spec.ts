import { test, gymsTestConfig } from './fixtures';
import { faker } from '@faker-js/faker';
import { gymCardFromDto, gymCardLinksFromDto } from '@ui/pages/gyms/gyms.card.mapper';
import { emptyPage } from '../common/testdata/mocks/empty-page';
import {
  SEEDED_GYM_BLACKWATER_VALLEY,
  SEEDED_GYM_BLACKWATER_VALLEY_PARTIAL_NAME,
  SEEDED_GYM_LIFFEY_GRAPPLING,
} from './seeded';
import { squash } from '@squash/annotations';

test.use(gymsTestConfig);

const seededGym = SEEDED_GYM_BLACKWATER_VALLEY;
const seededGymCard = gymCardFromDto(seededGym);
const seededGymPartialName = SEEDED_GYM_BLACKWATER_VALLEY_PARTIAL_NAME;
const otherCountyGym = SEEDED_GYM_LIFFEY_GRAPPLING;
const otherCountyGymCard = gymCardFromDto(otherCountyGym);

const seededGymLinks = gymCardLinksFromDto(seededGym);

test.describe('Gyms UI acceptance', { tag: ['@gyms', '@ui', '@desktop', '@squash'] }, () => {
  test(
    'visitor should see the gym list when opening Gyms',
    {
      tag: ['@smoke', '@acceptance'],
      annotation: squash({ weight: 'high', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ gymsPage }) => {
      await test.step('When a visitor opens Gyms', async () => {
        await gymsPage.goTo();
      });

      await test.step('Then the gym list is displayed', async () => {
        await gymsPage.verifyIsLoaded();
      });
    },
  );

  test(
    'visitor should see an empty state when no gym matches the search',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ gymsPage }) => {
      await test.step('When a visitor opens Gyms', async () => {
        await gymsPage.goTo();
      });

      await test.step('And the visitor searches for a name that matches nothing', async () => {
        await gymsPage.searchFor(faker.string.alphanumeric({ length: 12 }));
      });

      await test.step('Then no gyms are listed', async () => {
        await gymsPage.expectNoResults();
      });
    },
  );

  test(
    'visitor should find only the gym searched for by name',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ gymsPage }) => {
      await test.step('When a visitor opens Gyms', async () => {
        await gymsPage.goTo();
      });

      await test.step(`And the visitor searches for "${seededGym.name}"`, async () => {
        await gymsPage.searchFor(seededGym.name);
      });

      await test.step('Then only that gym is listed', async () => {
        await gymsPage.expectResultCount(1);
        await gymsPage.expectCardData(seededGymCard);
      });
    },
  );

  test(
    'visitor should find a gym by part of its name',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ gymsPage }) => {
      await test.step('When a visitor opens Gyms', async () => {
        await gymsPage.goTo();
      });

      await test.step(`And the visitor searches for "${seededGymPartialName}"`, async () => {
        await gymsPage.searchFor(seededGymPartialName);
      });

      await test.step('Then the gym matching that part of the name is listed', async () => {
        await gymsPage.expectResultCount(1);
        await gymsPage.expectCardData(seededGymCard);
      });
    },
  );

  test(
    "visitor should reach a gym's website and map location from its card",
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ gymsPage }) => {
      await test.step('When a visitor opens Gyms', async () => {
        await gymsPage.goTo();
      });

      await test.step(`And the visitor searches for "${seededGym.name}"`, async () => {
        await gymsPage.searchFor(seededGym.name);
      });

      await test.step('Then the gym card links to its website and map', async () => {
        await gymsPage.expectCardLinks(seededGymLinks);
      });
    },
  );

  test(
    'visitor should see only gyms from the chosen county when filtering by county',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ gymsPage }) => {
      await test.step('When a visitor opens Gyms', async () => {
        await gymsPage.goTo();
      });

      await test.step(`And the visitor filters by ${seededGym.county}`, async () => {
        await gymsPage.filterByCounty(seededGym.county);
      });

      await test.step(`Then only gyms from ${seededGym.county} are listed`, async () => {
        await gymsPage.expectOnlyCountyListed(seededGym.county);
        await gymsPage.expectCardAbsent(otherCountyGym.name);
        await gymsPage.expectCardData(seededGymCard);
      });
    },
  );

  test(
    'visitor should find gyms from other counties again after resetting the county filter',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ gymsPage }) => {
      await test.step('When a visitor opens Gyms', async () => {
        await gymsPage.goTo();
      });

      await test.step(`And the visitor filters by ${seededGym.county}`, async () => {
        await gymsPage.filterByCounty(seededGym.county);
      });

      await test.step(`And the visitor searches for "${otherCountyGym.name}"`, async () => {
        await gymsPage.searchFor(otherCountyGym.name);
      });

      await test.step('Then no gyms are listed', async () => {
        await gymsPage.expectNoResults();
      });

      await test.step('When the visitor resets the county filter', async () => {
        await gymsPage.resetCountyFilter();
      });

      await test.step(`Then "${otherCountyGym.name}" is listed`, async () => {
        await gymsPage.expectCardData(otherCountyGymCard);
      });
    },
  );

  test(
    'visitor should see the no-data message when there are no gyms to show',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ mockGyms, gymsPage }) => {
      await test.step('Given there are no gyms to show', async () => {
        await mockGyms(emptyPage);
      });

      await test.step('When a visitor opens Gyms', async () => {
        await gymsPage.goTo();
      });

      await test.step('Then the no-data message is displayed', async () => {
        await gymsPage.verifyIsLoaded();
        await gymsPage.expectEmptyStateMessage();
      });
    },
  );

  test(
    'visitor should see a network error message when gyms cannot be loaded because the connection fails',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ mockNetworkError, gymsPage }) => {
      await test.step("Given the visitor's connection fails while gyms load", async () => {
        await mockNetworkError();
      });

      await test.step('When a visitor opens Gyms', async () => {
        await gymsPage.goTo();
      });

      await test.step('Then a network error message is displayed', async () => {
        await gymsPage.expectNetworkErrorMessage();
      });
    },
  );

  test(
    'visitor should see a server error message when gyms cannot be loaded because of a server problem',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ mockServerError, gymsPage }) => {
      await test.step('Given the gym service is unavailable', async () => {
        await mockServerError();
      });

      await test.step('When a visitor opens Gyms', async () => {
        await gymsPage.goTo();
      });

      await test.step('Then a server error message is displayed', async () => {
        await gymsPage.expectServerErrorMessage();
      });
    },
  );

  test(
    'visitor should see the gym list after retrying when gyms failed to load',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ mockServerErrorOnce, gymsPage }) => {
      await test.step('Given the gym service is briefly unavailable', async () => {
        await mockServerErrorOnce();
      });

      await test.step('When a visitor opens Gyms', async () => {
        await gymsPage.goTo();
      });

      await test.step('Then a server error message is displayed', async () => {
        await gymsPage.expectServerErrorMessage();
      });

      await test.step('When the visitor retries the request', async () => {
        await gymsPage.retryAfterError();
      });

      await test.step('Then the gym list is displayed', async () => {
        await gymsPage.expectListNotEmpty();
      });
    },
  );
});
