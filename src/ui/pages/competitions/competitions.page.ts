import { expect, type Locator, type Page } from '@playwright/test';
import { ListPage } from '../common/list-page';
import { expectPageIndicator, goToNextListPage, goToPreviousListPage } from '../common/pagination.page';
import { getCompetitionCardData } from './competitions.card.page';
import { EMPTY_STATE, NO_DATA_COPY, TEST_IDS } from './competitions.constants';
import type { CompetitionCard } from './competitions.types';

export class CompetitionsPage extends ListPage<CompetitionCard> {
  constructor(page: Page) {
    super(page, { route: '/competitions', testIds: TEST_IDS, noDataCopy: NO_DATA_COPY });
  }

  protected readCardData(card: Locator): Promise<CompetitionCard> {
    return getCompetitionCardData(card);
  }

  override async expectNoResults(): Promise<void> {
    await super.expectNoResults();
    await expect(this.page.getByTestId(TEST_IDS.emptyStateTitle)).toHaveText(EMPTY_STATE.title);
    await expect(this.page.getByTestId(TEST_IDS.emptyStateMessageLine1)).toHaveText(EMPTY_STATE.messageLine1);
    await expect(this.page.getByTestId(TEST_IDS.emptyStateMessageLine2)).toHaveText(EMPTY_STATE.messageLine2);
  }

  async goToNextPage(): Promise<void> {
    await goToNextListPage(this.page);
  }

  async goToPreviousPage(): Promise<void> {
    await goToPreviousListPage(this.page);
  }

  async expectPagination(currentPage: number, totalPages: number): Promise<void> {
    await expectPageIndicator(this.page, currentPage, totalPages);
  }
}
