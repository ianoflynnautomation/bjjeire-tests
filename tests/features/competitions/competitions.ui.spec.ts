import { test } from '@ui/fixtures';
import type { CompetitionCard } from '@ui/features/competitions/competition-card.screen';

test.describe('Competitions @competitions @desktop', () => {
  test.beforeEach(({ featureFlags }) => {
    test.skip(!featureFlags.Competitions, "feature 'Competitions' disabled");
  });

  test('loads the competitions list @smoke @mobile', async ({ competitionsScreen }) => {
    await competitionsScreen.navigate();
    await competitionsScreen.verifyIsLoaded();
    await competitionsScreen.expectHeaderVisible();
  });

  test('No results message should display when user search for competition not in the list @regression', async ({
    competitionsScreen,
  }) => {
    await competitionsScreen.navigate();
    await competitionsScreen.searchFor('ADCC london');
    await competitionsScreen.expectNoResults();
    await competitionsScreen.clearSearch();
    await competitionsScreen.expectAtLeastOneResult();
  });

  test('Search filter should display competitions by name @regression', async ({ competitionsScreen }) => {
    const EXPECTED_COMPETITION_CARD: CompetitionCard = {
      name: 'ADCC Irish Cup Championship 2026',
      organisation: '',
      date: '',
      description: '',
      tags: [],
    };

    await competitionsScreen.navigate();
    await competitionsScreen.searchFor(EXPECTED_COMPETITION_CARD.name!);
    await competitionsScreen.expectSearchValue(EXPECTED_COMPETITION_CARD.name!);
    await competitionsScreen.expectCardData(EXPECTED_COMPETITION_CARD.name, EXPECTED_COMPETITION_CARD);
  });

  test('Search filter should display competitions by partial name @regression', async ({ competitionsScreen }) => {
    const EXPECTED_COMPETITION_CARD: CompetitionCard = {
      name: 'ADCC Irish Cup Championship 2026',
      organisation: '',
      date: '',
      description: '',
      tags: [],
    };
    const EXPECTED_COMPETITION_PARTIAL_NAME = 'ADCC Irish Cup Champi';

    await competitionsScreen.navigate();
    await competitionsScreen.searchFor(EXPECTED_COMPETITION_PARTIAL_NAME);
    await competitionsScreen.expectSearchValue(EXPECTED_COMPETITION_PARTIAL_NAME);
    await competitionsScreen.expectCardData(EXPECTED_COMPETITION_CARD.name, EXPECTED_COMPETITION_CARD);
  });
});
