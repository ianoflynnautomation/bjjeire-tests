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
const MAX_TAB_PRESSES = 40;
const KEY_DELAY_MS = 80;
const SEARCH_PAGE_SIZE = 100;

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

  /** Presses Tab until the control has focus, so the test proves it is in the keyboard order. */
  private async tabTo(control: Locator): Promise<void> {
    for (let presses = 0; presses < MAX_TAB_PRESSES; presses += 1) {
      await this.page.keyboard.press('Tab');
      if (await control.evaluate(element => element === document.activeElement)) break;
    }
    await expect(control).toBeFocused();
  }

  /** Keyboard only: Tab to the type button, then Enter. */
  async filterByTypeWithKeyboard(type: BjjEventType): Promise<void> {
    await waitForListOrEmpty(this.listItems, this.emptyState);
    const button = this.typeFilterButton(type);
    await this.tabTo(button);
    await this.page.keyboard.press('Enter');
    await expect(button).toHaveAttribute('aria-pressed', 'true');
  }

  /**
   * Keyboard only: Tab to the search box, then type the term at a human pace. At zero delay the box drops keystrokes
   * (typing "Rebel County" at once left "r" or "y"): each key rewrites the input from the address, so a faster
   * key overtakes the update. Finding F9 in specs/features/events.md: remove `KEY_DELAY_MS` when it is fixed.
   */
  async searchForWithKeyboard(term: string): Promise<void> {
    await this.tabTo(this.searchInput);
    // A search refetches the events (page size 100, finding F8) and filters them once they arrive. Wait for that
    // reload, or the list a count is read from can still be the one from before the search.
    const reloaded = this.page.waitForResponse(
      response =>
        response.request().method() === 'GET' &&
        EVENTS_LIST_API_ROUTE.test(response.url()) &&
        new URL(response.url()).searchParams.get('pageSize') === String(SEARCH_PAGE_SIZE),
    );
    await this.page.keyboard.type(term, { delay: KEY_DELAY_MS });
    await reloaded;
    await expect(this.searchInput).toHaveValue(term);
    // The search has applied once the address carries it, as `fillListSearch` waits.
    await expect(this.page).toHaveURL(url => url.searchParams.get('q') === term);
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

  /** Exactly these cards are listed, in this order. */
  async expectListedNames(names: readonly string[]): Promise<void> {
    await expect(this.page.getByTestId(TEST_IDS.cardName)).toHaveText([...names]);
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

  /** Every listed card and its type badges lie inside the screen's width, and each badge inside its card. */
  async expectCardsWithinScreenWidth(): Promise<void> {
    const overflows = async (): Promise<string[]> =>
      this.page.evaluate(
        ({ cardId, typeId }) => {
          const screenWidth = document.documentElement.clientWidth;
          const slack = 0.5; // sub-pixel rounding only
          const found: string[] = [];
          for (const card of document.querySelectorAll(`[data-testid="${cardId}"]`)) {
            const cardBox = card.getBoundingClientRect();
            const parts = [card, ...card.querySelectorAll(`[data-testid="${typeId}"]`)];
            for (const part of parts) {
              const box = part.getBoundingClientRect();
              const name = part.getAttribute('data-testid');
              if (box.left < -slack) found.push(`${name} left edge ${box.left} < 0`);
              if (box.right > screenWidth + slack)
                found.push(`${name} right edge ${box.right} > screen ${screenWidth}`);
              if (part !== card && box.right > cardBox.right + slack) {
                found.push(`${name} right edge ${box.right} > its card's right edge ${cardBox.right}`);
              }
            }
          }
          return found;
        },
        { cardId: TEST_IDS.listItem, typeId: EVENT_CARD_TEST_IDS.type },
      );
    await expect.poll(overflows).toEqual([]);
  }
}
