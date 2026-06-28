import { expect, test } from '@ui/fixtures';
import { faker } from '@faker-js/faker';
import { EXPECTED_GYM_BJJ_CORK_CARD, EXPECTED_GYM_BJJ_CORK_PARTIAL } from '../../testdata/gyms';
import { emptyPage, NO_DATA } from '@ui/pages/common/empty.page';
import { ERROR, ERROR_TITLE, NETWORK_ERROR_MESSAGE, SERVER_ERROR_MESSAGE } from '@ui/pages/common/error.page';

test.describe('Gyms UI acceptance', { tag: ['@gyms', '@ui', '@desktop'] }, () => {
  test(
    'Given available gyms, when a visitor opens Gyms, then the gym list is displayed',
    { tag: ['@smoke'] },
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
      await gymsPage.searchFor(EXPECTED_GYM_BJJ_CORK_CARD.name);
      await gymsPage.expectSearchValue(EXPECTED_GYM_BJJ_CORK_CARD.name);
      await gymsPage.expectCardData(EXPECTED_GYM_BJJ_CORK_CARD);
    },
  );

  test(
    'Given part of a gym name, when a visitor searches, then the matching gym is displayed',
    { tag: '@acceptance' },
    async ({ gymsPage }) => {
      await gymsPage.goTo();
      await gymsPage.searchFor(EXPECTED_GYM_BJJ_CORK_PARTIAL);
      await gymsPage.expectSearchValue(EXPECTED_GYM_BJJ_CORK_PARTIAL);
      await gymsPage.expectCardData(EXPECTED_GYM_BJJ_CORK_CARD);
    },
  );

  test(
    'Given the API returns no gyms, when a visitor opens Gyms, then the no-data message is shown',
    { tag: ['@gyms', '@acceptance'] },
    async ({ page, mockGyms, gymsPage }) => {
      await mockGyms(emptyPage);
      await gymsPage.goTo();
      await gymsPage.verifyIsLoaded();
      await expect(page.getByTestId(NO_DATA.title)).toHaveText('No Gyms Found');
      await expect(page.getByTestId(NO_DATA.messageLine1)).toHaveText('No gyms match your current filters.');
      await expect(page.getByTestId(NO_DATA.messageLine2)).toHaveText('Try a different county or check back later.');
    },
  );

  test(
    'Given the API request fails, when a visitor opens Gyms, then a network error message is shown',
    { tag: ['@gyms', '@acceptance'] },
    async ({ page, mockNetworkError, gymsPage }) => {
      await mockNetworkError('gyms');
      await gymsPage.goTo();
      await expect(page.getByTestId(ERROR.title)).toHaveText(ERROR_TITLE);
      await expect(page.getByTestId(ERROR.messageLine1)).toHaveText(NETWORK_ERROR_MESSAGE);
    },
  );

  test(
    'Given the API returns a server error, when a visitor opens Gyms, then a server error message is shown',
    { tag: ['@gyms', '@acceptance'] },
    async ({ page, mockServerError, gymsPage }) => {
      await mockServerError('gyms');
      await gymsPage.goTo();
      await expect(page.getByTestId(ERROR.title)).toHaveText(ERROR_TITLE);
      await expect(page.getByTestId(ERROR.messageLine1)).toHaveText(SERVER_ERROR_MESSAGE);
    },
  );
});
