import { expect, type Locator, type Page } from '@playwright/test';
import { expectNoDataState } from '../common/empty.page';
import { ListPage } from '../common/list-page';
import { expectPageIndicator, goToPreviousListPage } from '../common/pagination.page';
import { getCompetitionCardData } from './competitions.card.page';
import {
  COMPETITION_CARD_TEST_IDS,
  NO_DATA_COPY,
  NO_SEARCH_RESULTS_COPY,
  TEST_IDS,
  WEBSITE_UNAVAILABLE_COPY,
} from './competitions.constants';
import type { CompetitionCard, CompetitionCardLinks } from './competitions.types';

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

  async expectHeaderTotal(total: string): Promise<void> {
    await expect(this.page.getByTestId(TEST_IDS.headerTotal)).toHaveText(total);
  }

  async expectSeveralResults(): Promise<void> {
    await expect(this.listItems.nth(1)).toBeVisible();
  }

  async expectCardLinks(expected: CompetitionCardLinks): Promise<void> {
    const card = this.card(expected.name);
    await expect(card.getByTestId(COMPETITION_CARD_TEST_IDS.websiteButton)).toHaveAttribute('href', expected.website);
    await expect(card.getByTestId(COMPETITION_CARD_TEST_IDS.registerButton)).toHaveAttribute(
      'href',
      expected.registration,
    );
  }

  async expectCardLinksUnavailable(name: string): Promise<void> {
    const card = this.card(name);
    await expect(card.getByTestId(COMPETITION_CARD_TEST_IDS.websiteButton)).toHaveText(WEBSITE_UNAVAILABLE_COPY);
    await expect(card.getByTestId(COMPETITION_CARD_TEST_IDS.websiteButton)).toBeDisabled();
    await expect(card.getByRole('link')).toHaveCount(0);
  }
}
