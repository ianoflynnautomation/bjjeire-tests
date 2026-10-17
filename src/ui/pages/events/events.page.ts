import { expect, type Locator, type Page } from '@playwright/test';
import { waitForListOrEmpty, type TextMatcher } from '@ui/support';
import { expectNoDataState } from '../common/empty.page';
import { ListPage } from '../common/list-page';
import { getEventCardData } from './events.card.page';
import { EVENT_CARD_TEST_IDS, NO_DATA_COPY, NO_SEARCH_RESULTS_COPY, TEST_IDS } from './events.constants';
import type { BjjEventCard } from './events.types';

const ALL_COUNTIES_OPTION = 'all';

export class EventsPage extends ListPage<BjjEventCard> {
  constructor(page: Page) {
    super(page, { route: '/events', testIds: TEST_IDS, noDataCopy: NO_DATA_COPY });
  }

  protected readCardData(card: Locator): Promise<BjjEventCard> {
    return getEventCardData(card);
  }

  override async expectNoResults(): Promise<void> {
    await super.expectNoResults();
    await expectNoDataState(this.page, NO_SEARCH_RESULTS_COPY);
  }

  private get filters(): Locator {
    return this.page.getByTestId(TEST_IDS.filters);
  }

  private get countySelect(): Locator {
    return this.filters.getByTestId(TEST_IDS.countySelect);
  }

  private typeFilterButton(label: string): Locator {
    return this.filters.getByRole('button', { name: label, exact: true });
  }

  async filterByCounty(county: string): Promise<void> {
    await this.selectFilter(this.countySelect, county, EVENT_CARD_TEST_IDS.county);
  }

  async resetCountyFilter(): Promise<void> {
    await this.resetFilter(this.countySelect, ALL_COUNTIES_OPTION);
  }

  async filterByType(typeLabel: string): Promise<void> {
    await waitForListOrEmpty(this.listItems, this.emptyState);
    const button = this.typeFilterButton(typeLabel);
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await this.expectAllCardsMatchField(EVENT_CARD_TEST_IDS.type, typeLabel);
  }

  async expectHeaderTotal(total: TextMatcher): Promise<void> {
    await expect(this.page.getByTestId(TEST_IDS.headerTotal)).toHaveText(total);
  }
}
