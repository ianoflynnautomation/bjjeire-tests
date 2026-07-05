import { test } from '@ui/fixtures';
import { faker } from '@faker-js/faker';
import { gymCardFromDto } from '@ui/pages/gyms/gyms.card.mapper';
import { emptyPage } from '@ui/pages/common/empty.page';
import {
  SEEDED_GYM_BLACKWATER_VALLEY,
  SEEDED_GYM_BLACKWATER_VALLEY_PARTIAL_NAME,
  SEEDED_GYM_LIFFEY_GRAPPLING,
} from '../../testdata/seeded/gyms';

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

test.describe('Gyms UI acceptance', { tag: ['@gyms', '@ui', '@desktop'] }, () => {
  test(
    'Given available gyms, when a visitor opens Gyms, then the gym list is displayed',
    { tag: ['@smoke', '@acceptance'] },
    async ({ gymsPage }) => {
      await gymsPage.goTo();
      await gymsPage.verifyIsLoaded();
    },
  );

  test(
    'Given no matching gym, when a visitor searches, then an empty state is displayed',
    { tag: '@acceptance' },
    async ({ gymsPage }) => {
      await gymsPage.goTo();
      await gymsPage.searchFor(faker.string.alphanumeric({ length: 12 }));
      await gymsPage.expectNoResults();
    },
  );

  test(
    'Given a gym name, when a visitor searches, then only that gym is displayed',
    { tag: '@acceptance' },
    async ({ gymsPage }) => {
      await gymsPage.goTo();
      await gymsPage.searchFor(seededGym.name);
      await gymsPage.expectSearchValue(seededGym.name);
      await gymsPage.expectCardData(seededGymCard);
    },
  );

  test(
    'Given part of a gym name, when a visitor searches, then the matching gym is displayed',
    { tag: '@acceptance' },
    async ({ gymsPage }) => {
      await gymsPage.goTo();
      await gymsPage.searchFor(seededGymPartialName);
      await gymsPage.expectSearchValue(seededGymPartialName);
      await gymsPage.expectCardData(seededGymCard);
    },
  );

  test(
    'Given a gym card, when a visitor views it, then its website and map links point to the right destinations',
    { tag: '@acceptance' },
    async ({ gymsPage }) => {
      await gymsPage.goTo();
      await gymsPage.searchFor(seededGym.name);
      await gymsPage.expectCardLinks(seededGym.name, seededGymLinks);
    },
  );

  test(
    'Given gyms in several counties, when a visitor filters by county, then only gyms from that county are displayed',
    { tag: '@acceptance' },
    async ({ gymsPage }) => {
      await gymsPage.goTo();
      await gymsPage.filterByCounty(seededGym.county);
      await gymsPage.expectCardAbsent(otherCountyGym.name);
      await gymsPage.expectCardData(seededGymCard);
    },
  );

  test(
    'Given a county filter is applied, when the visitor resets it to all counties, then gyms from other counties can be found again',
    { tag: '@acceptance' },
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
    'Given the API returns no gyms, when a visitor opens Gyms, then the no-data message is shown',
    { tag: '@acceptance' },
    async ({ mockGyms, gymsPage }) => {
      await mockGyms(emptyPage);
      await gymsPage.goTo();
      await gymsPage.verifyIsLoaded();
      await gymsPage.expectEmptyStateMessage();
    },
  );

  test(
    'Given the API request fails, when a visitor opens Gyms, then a network error message is shown',
    { tag: '@acceptance' },
    async ({ mockNetworkError, gymsPage }) => {
      await mockNetworkError('gyms');
      await gymsPage.goTo();
      await gymsPage.expectNetworkErrorMessage();
    },
  );

  test(
    'Given the API returns a server error, when a visitor opens Gyms, then a server error message is shown',
    { tag: '@acceptance' },
    async ({ mockServerError, gymsPage }) => {
      await mockServerError('gyms');
      await gymsPage.goTo();
      await gymsPage.expectServerErrorMessage();
    },
  );

  test(
    'Given the API failed once, when the visitor retries, then the gym list is displayed',
    { tag: '@acceptance' },
    async ({ mockServerErrorOnce, gymsPage }) => {
      await mockServerErrorOnce('gyms');
      await gymsPage.goTo();
      await gymsPage.expectServerErrorMessage();
      await gymsPage.retryAfterError();
      await gymsPage.expectListNotEmpty();
    },
  );
});
