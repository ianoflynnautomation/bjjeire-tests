import { expect, type Locator, type Page } from '@playwright/test';
import type { BjjEventType } from '@api/features/events/events.types';
import type { County } from '@api/support';
import { waitForListOrEmpty, type TextMatcher } from '@ui/support';
import { expectNoDataState } from '../common/empty.page';
import { ListPage } from '../common/list-page';
import { getEventCardData } from './events.card.page';
import {
  ALL_TYPES_FILTER_LABEL,
  EVENT_CARD_TEST_IDS,
  EVENT_TYPE_FILTER_LABELS,
  NO_DATA_COPY,
  NO_SEARCH_RESULTS_COPY,
  TEST_IDS,
} from './events.constants';
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

  private typeFilterButton(type: BjjEventType): Locator {
    return this.filters.getByRole('button', { name: EVENT_TYPE_FILTER_LABELS[type], exact: true });
  }

  async filterByCounty(county: County): Promise<void> {
    await this.selectFilter(this.countySelect, county);
  }

  async expectOnlyCountyListed(county: County): Promise<void> {
    await this.expectAllCardsMatchField(EVENT_CARD_TEST_IDS.county, county);
  }

  async resetCountyFilter(): Promise<void> {
    await this.resetFilter(this.countySelect, ALL_COUNTIES_OPTION);
  }

  async filterByType(type: BjjEventType): Promise<void> {
    await waitForListOrEmpty(this.listItems, this.emptyState);
    const button = this.typeFilterButton(type);
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
  }

  async expectCountyChosen(county: County): Promise<void> {
    await expect(this.countySelect).toHaveValue(county);
  }

  async expectTypeChosen(type: BjjEventType): Promise<void> {
    await expect(this.typeFilterButton(type)).toHaveAttribute('aria-pressed', 'true');
  }

  async showAllTypes(): Promise<void> {
    await waitForListOrEmpty(this.listItems, this.emptyState);
    const button = this.filters.getByRole('button', { name: ALL_TYPES_FILTER_LABEL, exact: true });
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
  }

  async expectTypeNotChosen(type: BjjEventType): Promise<void> {
    await expect(this.typeFilterButton(type)).toHaveAttribute('aria-pressed', 'false');
  }

  async expectOnlyTypeListed(type: BjjEventType): Promise<void> {
    await this.expectAllCardsMatchField(EVENT_CARD_TEST_IDS.type, EVENT_TYPE_FILTER_LABELS[type]);
  }

  async expectHeaderTotal(total: TextMatcher): Promise<void> {
    await expect(this.page.getByTestId(TEST_IDS.headerTotal)).toHaveText(total);
  }
}
