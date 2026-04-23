import { expect, type Page } from '@playwright/test';
import { createListScreen, listScreenTestIds, type ListScreen } from '@ui/support/ui';
import { readCompetitionCard, type CompetitionCard } from './competition-card.screen';

export type CompetitionsScreen = ListScreen<CompetitionCard>;

export function createCompetitionsScreen(page: Page): CompetitionsScreen {
  const base = createListScreen<CompetitionCard>(page, {
    route: '/competitions',
    testIds: listScreenTestIds('competitions', 'competition'),
    readCard: readCompetitionCard,
  });

  const emptyStateTitle = page.getByTestId('no-data-state-title');
  const emptyStateMessage1 = page.getByTestId('no-data-state-message-line1');
  const emptyStateMessage2 = page.getByTestId('no-data-state-message-line2');

  return {
    ...base,
    async expectNoResults() {
      await base.expectNoResults();
      await expect(emptyStateTitle).toHaveText('No Results Found');
      await expect(emptyStateMessage1).toHaveText('No competitions matched your search. Try different keywords.');
      await expect(emptyStateMessage2).toHaveText('Try adjusting your filters or check back later.');
    },
  };
}
