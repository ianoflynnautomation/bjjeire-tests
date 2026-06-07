import { test } from '@ui/fixtures';
import { faker } from '@faker-js/faker';
import { EXPECTED_GYM_BJJ_CORK_CARD, EXPECTED_GYM_BJJ_CORK_PARTIAL } from '../../testdata/gyms';
import gymsFixture from '../../testdata/mocks/gyms.page-1.json';

test.describe('Gyms UI acceptance', { tag: ['@gyms', '@ui', '@desktop'] }, () => {
  test.beforeEach(async ({ mockGyms }) => {
    await mockGyms(gymsFixture);
  });

  test(
    'Given available gyms, when a visitor opens Gyms, then the gym list is displayed',
    { tag: ['@smoke'] },
    async ({ gymsPage }) => {
      await gymsPage.navigate();
      await gymsPage.verifyIsLoaded();
    },
  );

  test(
    'Given no matching gym, when a visitor searches, then an empty state is displayed',
    { tag: '@acceptance' },
    async ({ gymsPage }) => {
      await gymsPage.navigate();
      await gymsPage.searchFor(faker.string.alphanumeric({ length: 12 }));
      await gymsPage.expectNoResults();
    },
  );

  test(
    'Given a gym name, when a visitor searches, then only that gym is displayed',
    { tag: '@acceptance' },
    async ({ gymsPage }) => {
      await gymsPage.navigate();
      await gymsPage.searchFor(EXPECTED_GYM_BJJ_CORK_CARD.name);
      await gymsPage.expectSearchValue(EXPECTED_GYM_BJJ_CORK_CARD.name);
      await gymsPage.expectCardData(EXPECTED_GYM_BJJ_CORK_CARD.name, EXPECTED_GYM_BJJ_CORK_CARD);
    },
  );

  test(
    'Given part of a gym name, when a visitor searches, then the matching gym is displayed',
    { tag: '@acceptance' },
    async ({ gymsPage }) => {
      await gymsPage.navigate();
      await gymsPage.searchFor(EXPECTED_GYM_BJJ_CORK_PARTIAL);
      await gymsPage.expectSearchValue(EXPECTED_GYM_BJJ_CORK_PARTIAL);
      await gymsPage.expectCardData(EXPECTED_GYM_BJJ_CORK_CARD.name, EXPECTED_GYM_BJJ_CORK_CARD);
    },
  );
});
