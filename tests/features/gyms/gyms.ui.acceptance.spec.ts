import { test, gymsTestConfig } from './fixtures';
import { faker } from '@faker-js/faker';
import { gymCardFromDto } from '@ui/pages/gyms/gyms.card.mapper';
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

const { coordinates } = seededGym.location;
const seededGymLinks = {
  website: seededGym.website ?? '',
  googleMaps: `https://www.google.com/maps/search/?api=1&query=${coordinates.latitude},${coordinates.longitude}`,
};

test.describe('Gyms UI acceptance', { tag: ['@gyms', '@ui', '@desktop', '@squash'] }, () => {
  test(
    'visitor should see the gym list when opening Gyms',
    {
      tag: ['@smoke', '@acceptance'],
      annotation: squash({ weight: 'high', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ gymsPage }) => {
      await gymsPage.goTo();
      await gymsPage.verifyIsLoaded();
    },
  );

  test(
    'visitor should see an empty state when no gym matches the search',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ gymsPage }) => {
      await gymsPage.goTo();
      await gymsPage.searchFor(faker.string.alphanumeric({ length: 12 }));
      await gymsPage.expectNoResults();
    },
  );

  test(
    'visitor should find only the gym searched for by name',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ gymsPage }) => {
      await gymsPage.goTo();
      await gymsPage.searchFor(seededGym.name);
      await gymsPage.expectResultCount(1);
      await gymsPage.expectCardData(seededGymCard);
    },
  );

  test(
    'visitor should find a gym by part of its name',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ gymsPage }) => {
      await gymsPage.goTo();
      await gymsPage.searchFor(seededGymPartialName);
      await gymsPage.expectResultCount(1);
      await gymsPage.expectCardData(seededGymCard);
    },
  );

  test(
    'visitor should see website and map links pointing to the right destinations on a gym card',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ gymsPage }) => {
      await gymsPage.goTo();
      await gymsPage.searchFor(seededGym.name);
      await gymsPage.expectCardLinks(seededGym.name, seededGymLinks);
    },
  );

  test(
    'visitor should see only gyms from the county filtered by',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ gymsPage }) => {
      await gymsPage.goTo();
      await gymsPage.filterByCounty(seededGym.county);
      await gymsPage.expectCardAbsent(otherCountyGym.name);
      await gymsPage.expectCardData(seededGymCard);
    },
  );

  test(
    'visitor should find gyms from other counties again after resetting the county filter',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ gymsPage }) => {
      await gymsPage.goTo();
      await gymsPage.filterByCounty(seededGym.county);
      await gymsPage.searchFor(otherCountyGym.name);
      await gymsPage.expectNoResults();
      await gymsPage.resetCountyFilter();
      await gymsPage.expectCardData(otherCountyGymCard);
    },
  );

  test(
    'visitor should see the no-data message when the API returns no gyms',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ mockGyms, gymsPage }) => {
      await mockGyms(emptyPage);
      await gymsPage.goTo();
      await gymsPage.verifyIsLoaded();
      await gymsPage.expectEmptyStateMessage();
    },
  );

  test(
    'visitor should see a network error message when the gyms request fails',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ mockNetworkError, gymsPage }) => {
      await mockNetworkError();
      await gymsPage.goTo();
      await gymsPage.expectNetworkErrorMessage();
    },
  );

  test(
    'visitor should see a server error message when the gyms API returns a server error',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ mockServerError, gymsPage }) => {
      await mockServerError();
      await gymsPage.goTo();
      await gymsPage.expectServerErrorMessage();
    },
  );

  test(
    'visitor should see the gym list after retrying a failed request',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ mockServerErrorOnce, gymsPage }) => {
      await mockServerErrorOnce();
      await gymsPage.goTo();
      await gymsPage.expectServerErrorMessage();
      await gymsPage.retryAfterError();
      await gymsPage.expectListNotEmpty();
    },
  );
});
