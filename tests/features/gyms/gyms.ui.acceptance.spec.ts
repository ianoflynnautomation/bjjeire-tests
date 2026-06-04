import { test } from '@ui/fixtures';
import * as GymsPage from '@ui/pages/gyms/gyms.page';
import { SEEDED_GYM_BJJ_CORK, SEEDED_GYM_BJJ_CORK_PARTIAL } from '../../testdata/gyms';

test.describe('Gyms UI Acceptance', { tag: ['@gyms', '@ui', '@desktop'] }, () => {
  test('loads the gyms list', { tag: ['@smoke'] }, async () => {
    await GymsPage.navigate();
    await GymsPage.verifyIsLoaded();
  });

  test('search with no match shows the empty state', { tag: '@acceptance' }, async () => {
    await GymsPage.navigate();
    await GymsPage.searchFor('xyz');
    await GymsPage.expectNoResults();
  });

  test('search by gym name shows that gym only', { tag: '@acceptance' }, async () => {
    await GymsPage.navigate();
    await GymsPage.searchFor(SEEDED_GYM_BJJ_CORK.name);
    await GymsPage.expectSearchValue(SEEDED_GYM_BJJ_CORK.name);
    await GymsPage.expectCardData(SEEDED_GYM_BJJ_CORK.name, SEEDED_GYM_BJJ_CORK);
  });

  test('search by partial gym name shows that gym only', { tag: '@acceptance' }, async () => {
    await GymsPage.navigate();
    await GymsPage.searchFor(SEEDED_GYM_BJJ_CORK_PARTIAL);
    await GymsPage.expectSearchValue(SEEDED_GYM_BJJ_CORK_PARTIAL);
    await GymsPage.expectCardData(SEEDED_GYM_BJJ_CORK.name, SEEDED_GYM_BJJ_CORK);
  });
});
