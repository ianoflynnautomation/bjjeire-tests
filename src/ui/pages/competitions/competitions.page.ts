import type { Locator, Page } from '@playwright/test';
import { expectNoDataState } from '../common/empty.page';
import { ListPage } from '../common/list-page';
import { expectPageIndicator, goToPreviousListPage } from '../common/pagination.page';
import { getCompetitionCardData } from './competitions.card.page';
import { NO_DATA_COPY, NO_SEARCH_RESULTS_COPY, TEST_IDS } from './competitions.constants';
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
    await expectNoDataState(this.page, NO_SEARCH_RESULTS_COPY);
  }

  async goToPreviousPage(): Promise<void> {
    await goToPreviousListPage(this.page);
  }

  async expectPagination(currentPage: number, totalPages: number): Promise<void> {
    await expectPageIndicator(this.page, currentPage, totalPages);
  }
}
