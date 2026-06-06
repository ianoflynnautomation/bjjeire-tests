import { test } from '@ui/fixtures';
import { SEEDED_GYM_BJJ_CORK, SEEDED_GYM_BJJ_CORK_PARTIAL } from '../../testdata/gyms';

test.describe('Gyms UI Acceptance', { tag: ['@gyms', '@ui', '@desktop'] }, () => {
  test('loads the gyms list', { tag: ['@smoke'] }, async ({ gymsPage }) => {
    await gymsPage.navigate();
    await gymsPage.verifyIsLoaded();
  });

  test('search with no match shows the empty state', { tag: '@acceptance' }, async ({ gymsPage }) => {
    await gymsPage.navigate();
    await gymsPage.searchFor('xyz');
    await gymsPage.expectNoResults();
  });

  test('search by gym name shows that gym only', { tag: '@acceptance' }, async ({ gymsPage }) => {
    await gymsPage.navigate();
    await gymsPage.searchFor(SEEDED_GYM_BJJ_CORK.name);
    await gymsPage.expectSearchValue(SEEDED_GYM_BJJ_CORK.name);
    await gymsPage.expectCardData(SEEDED_GYM_BJJ_CORK.name, SEEDED_GYM_BJJ_CORK);
  });

  test('search by partial gym name shows that gym only', { tag: '@acceptance' }, async ({ gymsPage }) => {
    await gymsPage.navigate();
    await gymsPage.searchFor(SEEDED_GYM_BJJ_CORK_PARTIAL);
    await gymsPage.expectSearchValue(SEEDED_GYM_BJJ_CORK_PARTIAL);
    await gymsPage.expectCardData(SEEDED_GYM_BJJ_CORK.name, SEEDED_GYM_BJJ_CORK);
  });
});
