import { expect, type Locator, type Page } from '@playwright/test';
import { TIMEOUTS } from '@shared/config/timeouts';
import { expectNoError } from '../common/error.page';
import { expectNoDataState } from '../common/empty.page';
import { ListPage } from '../common/list-page';
import { expectPageIndicator, goToPreviousListPage } from '../common/pagination.page';
import { getCompetitionCardData } from './competitions.card.page';
import {
  COMPETITION_CARD_TEST_IDS,
  BJJEIRE_COMPETITION_COPY,
  BJJEIRE_COMPETITIONS_API_ROUTE,
  FEATURED_COPY,
  FEATURED_TEST_IDS,
  NO_DATA_COPY,
  NO_SEARCH_RESULTS_COPY,
  TEST_IDS,
  WEBSITE_UNAVAILABLE_COPY,
} from './competitions.constants';
import type { CompetitionCard, CompetitionCardLinks, FeaturedCompetitionExpectation } from './competitions.types';

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

  /** Opens the card and waits for the competition's own page address, so the next step starts on that page. */
  async openFeaturedCompetition(name: string): Promise<void> {
    await this.featuredCard(name)
      .getByRole('link', { name: `${BJJEIRE_COMPETITION_COPY.viewLinkPrefix}${name}`, exact: true })
      .click();
    await this.page.waitForURL(/\/competitions\/[^/?]+$/);
  }

  /**
   * Opens Competitions and waits for the BJJ Éire competitions call to answer, so a "nothing is shown" check
   * afterwards runs after the response (mocked or real) has been delivered in full, not only started (`waitForResponse` resolves on headers).
   */
  async goToAwaitingFeatured(): Promise<void> {
    const answered = this.page.waitForResponse(
      response => response.request().method() === 'GET' && BJJEIRE_COMPETITIONS_API_ROUTE.test(response.url()),
    );
    await this.goTo();
    const response = await answered;
    await response.finished();
  }

  /**
   * Starts counting requests to the BJJ Éire competitions call and returns the count. Call it once, before
   * opening the page; each call registers its own listener.
   */
  countFeaturedRequests(): () => number {
    let count = 0;
    this.page.on('request', request => {
      if (request.method() === 'GET' && BJJEIRE_COMPETITIONS_API_ROUTE.test(request.url())) count += 1;
    });
    return () => count;
  }

  /** The call was made exactly once: paging did not load the featured competitions again. */
  expectFeaturedLoadedOnce(requestCount: () => number): void {
    expect(requestCount(), 'requests to the BJJ Éire competitions call').toBe(1);
  }

  /** The featured block, or the one card `name`, sits above the search box. Waits for both to be visible. */
  async expectFeaturedAboveSearch(name?: string): Promise<void> {
    const target = name ? this.featuredCard(name) : this.featuredHeading;
    const search = this.page.getByTestId(TEST_IDS.search);
    await expect(target).toBeVisible();
    await expect(search).toBeVisible();
    await expect(async () => {
      const targetBox = await target.boundingBox();
      const searchBox = await search.boundingBox();
      expect(targetBox, 'featured element has a box').not.toBeNull();
      expect(searchBox, 'search box has a box').not.toBeNull();
      expect(targetBox?.y ?? Infinity).toBeLessThan(searchBox?.y ?? -Infinity);
    }).toPass({ timeout: TIMEOUTS.expect });
  }

  /** No section, no heading, no intro line and no empty placeholder in the featured slot. */
  async expectNoFeaturedSection(): Promise<void> {
    const main = this.page.getByRole('main');
    await expect(this.page.getByTestId(FEATURED_TEST_IDS.section)).toHaveCount(0);
    await expect(this.page.getByTestId(FEATURED_TEST_IDS.card)).toHaveCount(0);
    await expect(main.getByText(FEATURED_COPY.heading, { exact: true })).toHaveCount(0);
    await expect(main.getByText(FEATURED_COPY.intro, { exact: true })).toHaveCount(0);
  }

  async expectNoErrorMessage(): Promise<void> {
    await expectNoError(this.page);
  }

  private get featuredHeading(): Locator {
    return this.page
      .getByTestId(FEATURED_TEST_IDS.section)
      .getByRole('heading', { level: 2, name: FEATURED_COPY.heading });
  }

  private get featuredCards(): Locator {
    return this.page.getByTestId(FEATURED_TEST_IDS.card);
  }

  async expectFeaturedOrder(names: readonly string[]): Promise<void> {
    const featuredNames = this.featuredCards.getByRole('heading', { level: 3 });
    await expect(async () => {
      const shown = await featuredNames.allTextContents();
      const positions = names.map(name => shown.indexOf(name));
      expect(positions, `featured names ${JSON.stringify(shown)}`).not.toContain(-1);
      expect(positions).toEqual([...positions].sort((a, b) => a - b));
    }).toPass({ timeout: TIMEOUTS.expect });
  }

  async expectFeaturedDetails(expected: FeaturedCompetitionExpectation): Promise<void> {
    const card = this.featuredCard(expected.name);
    await expect(card.getByText(expected.date, { exact: true })).toBeVisible();
    await expect(card.getByText(expected.venue, { exact: true })).toBeVisible();
    await expect(card.getByText(expected.fee, { exact: true })).toBeVisible();
    await expect(card.getByText(expected.divisions, { exact: true })).toBeVisible();
  }

  async expectFeaturedStatus(name: string, status: string): Promise<void> {
    await expect(this.featuredCard(name).getByText(status, { exact: true })).toBeVisible();
  }

  private featuredCard(name: string): Locator {
    return this.featuredCards.filter({ has: this.page.getByRole('heading', { level: 3, name, exact: true }) });
  }
}
