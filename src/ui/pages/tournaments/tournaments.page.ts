import { expect, type Locator, type Page } from '@playwright/test';
import { expectNoDataState } from '../common/empty.page';
import { ListPage } from '../common/list-page';
import { getTournamentCardData } from './tournaments.card.page';
import {
  HEADER_TOTAL_COPY,
  NO_DATA_COPY,
  NO_SEARCH_RESULTS_COPY,
  TEST_IDS,
  TOURNAMENTS_LIST_API_ROUTE,
  VIEW_TOURNAMENT_LINK_PREFIX,
} from './tournaments.constants';
import type { TournamentCard } from './tournaments.types';

export class TournamentsPage extends ListPage<TournamentCard> {
  constructor(page: Page) {
    super(page, {
      route: '/tournaments',
      testIds: TEST_IDS,
      noDataCopy: NO_DATA_COPY,
      listApiRoute: TOURNAMENTS_LIST_API_ROUTE,
    });
  }

  protected readCardData(card: Locator): Promise<TournamentCard> {
    return getTournamentCardData(card);
  }

  /** Exact name: "Acceptance Open" is also the start of the seeded "Acceptance Opens Later". */
  protected override card(name: string): Locator {
    const cardName = this.page.getByTestId(TEST_IDS.cardName).getByText(name, { exact: true });
    return this.listItems.filter({ has: cardName });
  }

  /** Chooses "View tournament" on the card with exactly this name, as a visitor does. */
  async openTournament(name: string): Promise<void> {
    await this.card(name)
      .getByRole('link', { name: `${VIEW_TOURNAMENT_LINK_PREFIX}: ${name}` })
      .click();
  }

  override async expectNoResults(): Promise<void> {
    await super.expectNoResults();
    await expectNoDataState(this.page, NO_SEARCH_RESULTS_COPY);
  }

  /**
   * The header total equals the number of cards the visitor can page through: an independent count.
   * Call it with no search active and from page 1: with a search the header counts the browser-filtered cards,
   * not the API total. `atLeast` is a floor from the seed, so a list that never came back in full cannot pass.
   */
  async expectHeaderTotalMatchesListedCards(options: { atLeast: number }): Promise<void> {
    const listed = await this.countListedCards();
    expect(listed, `cards listed across all pages (at least ${options.atLeast} expected)`).toBeGreaterThanOrEqual(
      options.atLeast,
    );
    const suffix = listed === 1 ? HEADER_TOTAL_COPY.singular : HEADER_TOTAL_COPY.plural;
    await expect(this.page.getByTestId(TEST_IDS.headerTotal)).toHaveText(
      `${HEADER_TOTAL_COPY.prefix} ${listed} ${suffix}`,
    );
  }
}
