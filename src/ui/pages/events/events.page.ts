import { expect, type Locator, type Page } from '@playwright/test';
import type { BjjEventType } from '@api/features/events/events.types';
import { DEFAULT_PAGE_SIZE, type County } from '@api/support';
import { waitForListOrEmpty, type TextMatcher } from '@ui/support';
import { expectNoDataState } from '../common/empty.page';
import { ListPage } from '../common/list-page';
import { parseRenderedDateRange, type RenderedDateRange } from './events.dates';
import { getEventCardData } from './events.card.page';
import {
  ALL_TYPES_FILTER_LABEL,
  EVENT_CARD_TEST_IDS,
  EVENT_TYPE_FILTER_LABELS,
  EVENTS_LIST_API_ROUTE,
  NO_DATA_COPY,
  NO_SEARCH_RESULTS_COPY,
  TEST_IDS,
} from './events.constants';
import { eventCountySelect, eventFilters, eventTypeFilterButton } from './events.filters';
import type { BjjEventCard } from './events.types';

const ALL_COUNTIES_OPTION = 'all';

export class EventsPage extends ListPage<BjjEventCard> {
  constructor(page: Page) {
    super(page, { route: '/events', testIds: TEST_IDS, noDataCopy: NO_DATA_COPY, listApiRoute: EVENTS_LIST_API_ROUTE });
  }

  protected readCardData(card: Locator): Promise<BjjEventCard> {
    return getEventCardData(card);
  }

  override async expectNoResults(): Promise<void> {
    await super.expectNoResults();
    await expectNoDataState(this.page, NO_SEARCH_RESULTS_COPY);
  }

  private get filters(): Locator {
    return eventFilters(this.page);
  }

  private get countySelect(): Locator {
    return eventCountySelect(this.page);
  }

  private typeFilterButton(type: BjjEventType): Locator {
    return eventTypeFilterButton(this.page, type);
  }

  /** Waits until the list has settled on cards or the empty state; asserts nothing. */
  async waitForResults(): Promise<void> {
    await waitForListOrEmpty(this.listItems, this.emptyState);
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

  /**
   * The header total equals the number of cards the visitor can page through: an independent count.
   * Call it only with no client-side search active, starting from page 1: a search is applied in the browser while
   * the pager is server-side, so counting under a search pages through empty pages and ends on the last one.
   * `atLeast` is a floor that does not come from the page, so a list that never came back in full cannot pass.
   */
  async expectHeaderTotalMatchesListedCards(options: { atLeast: number }): Promise<void> {
    // The previous list can still be on screen for a moment after a search is cleared or a filter changes.
    await expect
      .poll(() => this.listItems.count(), { message: 'cards on the first page' })
      .toBeGreaterThanOrEqual(Math.min(options.atLeast, DEFAULT_PAGE_SIZE));
    const listed = await this.countListedCards();
    expect(listed, `cards listed across all pages (at least ${options.atLeast} expected)`).toBeGreaterThanOrEqual(
      options.atLeast,
    );
    await this.expectHeaderTotal(`Found ${listed} ${listed === 1 ? 'event' : 'events'}.`);
  }

  /** The days a card's schedule shows, read as calendar days so a test can compare gaps. */
  async readScheduledDays(name: string): Promise<RenderedDateRange> {
    const { schedule } = await this.readCard(name);
    if (!schedule) throw new Error(`The card for "${name}" shows no schedule`);
    return parseRenderedDateRange(schedule);
  }
}
