import { expect, type Locator, type Page } from '@playwright/test';
import type { BjjEventType } from '@api/features/events/events.types';
import type { County } from '@api/support';
import { TIMEOUTS } from '@shared/config/timeouts';
import { gotoAppShell, gotoRoute } from '@ui/support';
import {
  MAP_REGION_NAME,
  MAP_NOTICE_TEST_IDS,
  POPUP_TEST_IDS,
  MAP_TEST_IDS,
  MAP_TILE_SELECTOR,
  MAP_POPUP_CONTAINER_SELECTOR,
  THEME_STORAGE_KEY,
  UNMAPPED_NOTICE_COPY,
  TRUNCATED_NOTICE_COPY,
  TILES_FAILED_COPY,
} from './events.constants';
import { parseRenderedDateRange, type RenderedDateRange } from './events.dates';
import type { ExpectedMapPopup } from './events.card.mapper';
import type { RatioBounds } from './events.geo';
import { Theme } from '../sections/header.constants';
import { eventCountySelect, eventTypeFilterButton } from './events.filters';

/** Upper bound for reaching a control by Tab: fails the step rather than looping forever. */
const MAX_TAB_PRESSES = 40;

export class EventsMapPage {
  constructor(private readonly page: Page) {}

  private get region(): Locator {
    return this.page.getByRole('region', { name: MAP_REGION_NAME });
  }

  /** A venue's pin is named for the venue, plus `, <n> events` when it holds several events. */
  private pin(venue: string, eventCount: number): Locator {
    const name = eventCount > 1 ? `${venue}, ${eventCount} events` : venue;
    return this.page.getByTestId(MAP_TEST_IDS.map).getByRole('button', { name, exact: true });
  }

  /** Stores the theme before any page script runs, as the app reads it on boot. Call before navigating. */
  async chooseThemeBeforeLoad(theme: Theme): Promise<void> {
    await this.page.addInitScript(
      ({ key, value }) => {
        localStorage.setItem(key, value);
      },
      { key: THEME_STORAGE_KEY, value: theme },
    );
  }

  /** Competition is a dark variant, so it carries both the `dark` and `competition` classes. */
  async expectThemeApplied(theme: Theme): Promise<void> {
    const root = this.page.locator('html');
    if (theme === Theme.Light) await expect(root).not.toHaveClass(/\bdark\b/);
    else await expect(root).toHaveClass(/\bdark\b/);
    if (theme === Theme.Competition) await expect(root).toHaveClass(/\bcompetition\b/);
    else await expect(root).not.toHaveClass(/\bcompetition\b/);
  }

  /**
   * Axe's contrast and link rules crash on blended map tiles and skip the whole page. Setting tiles to `normal`
   * lets those rules run. Excludes nothing.
   */
  async makeTilesReadableByAxe(): Promise<void> {
    await this.page
      .getByTestId(MAP_TEST_IDS.map)
      .locator(MAP_TILE_SELECTOR)
      .evaluateAll(tiles => {
        for (const tile of tiles) (tile as HTMLElement).style.mixBlendMode = 'normal';
      });
  }

  /** Leaflet fades a popup in over 0.2 s, and `toBeVisible` passes at opacity 0; a scan must not catch it mid-fade. */
  async expectPopupFullyOpaque(): Promise<void> {
    await expect(this.page.getByTestId(MAP_TEST_IDS.map).locator(MAP_POPUP_CONTAINER_SELECTOR)).toHaveCSS(
      'opacity',
      '1',
    );
  }

  async goToMap(): Promise<void> {
    await gotoRoute(this.page, '/events?view=map', this.region);
  }

  async goToMapWithQuery(query: string): Promise<void> {
    await gotoRoute(this.page, `/events?view=map&${query}`, this.region);
  }

  /** Opens the map link without waiting for the map: when events fail to load the page shows an error instead. */
  async openMapLink(query?: string): Promise<void> {
    await gotoAppShell(this.page, query ? `/events?view=map&${query}` : '/events?view=map');
  }

  async switchToMap(): Promise<void> {
    await this.page.getByTestId(MAP_TEST_IDS.viewSwitchMap).click();
    await expect(this.region).toBeVisible();
  }

  async expectMapDisplayed(): Promise<void> {
    await expect(this.region).toBeVisible();
  }

  async expectMapIsCurrentView(): Promise<void> {
    await expect(this.page.getByTestId(MAP_TEST_IDS.viewSwitchMap)).toHaveAttribute('aria-pressed', 'true');
  }

  async expectPinFor(venue: string, eventCount = 1): Promise<void> {
    await expect(this.pin(venue, eventCount)).toBeVisible();
  }

  async expectPinsFor(pins: readonly Readonly<{ venue: string; eventCount: number }>[]): Promise<void> {
    for (const { venue, eventCount } of pins) await this.expectPinFor(venue, eventCount);
  }

  /** The list's filter helpers wait for cards, which the map view does not show. */
  async filterByCounty(county: County): Promise<void> {
    const select = eventCountySelect(this.page);
    await select.selectOption(county);
    await expect(select).toHaveValue(county);
  }

  async filterByType(type: BjjEventType): Promise<void> {
    const button = eventTypeFilterButton(this.page, type);
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
  }

  async switchToList(): Promise<void> {
    await this.page.getByTestId(MAP_TEST_IDS.viewSwitchList).click();
    await expect(this.region).toHaveCount(0);
  }

  /** Browser Back: from the map, with the view switch's history entry, to the list. */
  async goBackToList(): Promise<void> {
    await this.page.goBack();
    await expect(this.region).toHaveCount(0);
  }

  async expectAddressWithoutMapView(): Promise<void> {
    await expect(this.page).toHaveURL(url => !url.searchParams.has('view'));
  }

  /** Zoom level `z` of the tiles shown (tile URLs are .../{z}/{x}/{y}.png). While zooming, old and new tiles coexist, so the highest wins. */
  async tileZoom(): Promise<number> {
    const sources = await this.page
      .getByTestId(MAP_TEST_IDS.map)
      .locator(MAP_TILE_SELECTOR)
      .evaluateAll(tiles => tiles.map(tile => tile.getAttribute('src') ?? ''));
    const zooms = sources
      .map(src => Number(/\/(\d+)\/\d+\/\d+\.png/.exec(src)?.[1]))
      .filter(zoom => !Number.isNaN(zoom));
    return zooms.length ? Math.max(...zooms) : Number.NaN;
  }

  /** The zoom once it is a finite number that two reads in a row agree on (the map fits its bounds after loading). */
  async settledTileZoom(): Promise<number> {
    let previous = Number.NaN;
    let settled = Number.NaN;
    await expect
      .poll(
        async () => {
          const zoom = await this.tileZoom();
          const isSettled = Number.isFinite(zoom) && zoom === previous;
          previous = zoom;
          if (isSettled) settled = zoom;
          return isSettled;
        },
        { message: 'map tile zoom level to settle' },
      )
      .toBe(true);
    return settled;
  }

  /** The pin's box lies inside the map's box, so it is on screen and not clipped. */
  private async expectPinInsideMap(venue: string): Promise<void> {
    await expect(async () => {
      const [pin, map] = await Promise.all([this.pin(venue, 1).boundingBox(), this.region.boundingBox()]);
      if (!pin || !map) throw new Error(`Pin for "${venue}" and the map must be on screen to measure`);
      expect(pin.x, `left of "${venue}" pin`).toBeGreaterThanOrEqual(map.x);
      expect(pin.y, `top of "${venue}" pin`).toBeGreaterThanOrEqual(map.y);
      expect(pin.x + pin.width, `right of "${venue}" pin`).toBeLessThanOrEqual(map.x + map.width);
      expect(pin.y + pin.height, `bottom of "${venue}" pin`).toBeLessThanOrEqual(map.y + map.height);
    }).toPass({ timeout: TIMEOUTS.expect });
  }

  /** Polled: the map fits its bounds after the results change. Zoomed in on a single-event pin that is inside the map. */
  async expectZoomedInOnPin(zoomBefore: number, venue: string): Promise<void> {
    expect(zoomBefore, 'zoom before').not.toBeNaN();
    await expect.poll(() => this.tileZoom(), { message: 'map tile zoom level' }).toBeGreaterThan(zoomBefore);
    await this.expectPinInsideMap(venue);
  }

  private get tilesFailedNotice(): Locator {
    return this.page.getByTestId(MAP_NOTICE_TEST_IDS.tilesFailed);
  }

  /** The app shows the notice on the first failed tile, so no count of failures is awaited. */
  async expectTilesFailedNotice(): Promise<void> {
    await expect(this.tilesFailedNotice).toContainText(TILES_FAILED_COPY.message);
    await expect(this.tilesFailedNotice.getByRole('link', { name: TILES_FAILED_COPY.listLink })).toBeVisible();
  }

  async followTilesFailedListLink(): Promise<void> {
    await this.tilesFailedNotice.getByRole('link', { name: TILES_FAILED_COPY.listLink }).click();
  }

  async expectMapNotDisplayed(): Promise<void> {
    await expect(this.region).toHaveCount(0);
  }

  /** The map link did not change the route: the visitor stays on Events, and `view=map` is not honoured. */
  async expectOnEventsPath(): Promise<void> {
    await expect(this.page).toHaveURL(url => url.pathname === '/events');
  }

  async expectViewSwitchAbsent(): Promise<void> {
    await expect(this.page.getByTestId(MAP_TEST_IDS.viewSwitch)).toHaveCount(0);
  }

  async expectListUrlFor(county: County): Promise<void> {
    await expect(this.page).toHaveURL(
      url => url.pathname === '/events' && url.searchParams.get('county') === county && !url.searchParams.has('view'),
    );
  }

  async expectUnmappedNotice(count: number): Promise<void> {
    const copy = count === 1 ? UNMAPPED_NOTICE_COPY.singular : UNMAPPED_NOTICE_COPY.plural;
    await expect(this.page.getByTestId(MAP_NOTICE_TEST_IDS.unmapped)).toHaveText(`${count} ${copy}`);
  }

  /** The map has exactly one pin, named for the venue (so no other event, at the shared venue or elsewhere, is shown). */
  async expectOnlyPin(venue: string): Promise<void> {
    const pins = this.page.getByTestId(MAP_TEST_IDS.pin);
    await expect(pins).toHaveCount(1);
    await expect(pins).toHaveAccessibleName(venue);
  }

  /** Also catches a multi-event pin: the name may end `, <n> events`. */
  async expectNoPinFor(venue: string): Promise<void> {
    const escaped = venue.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
    const name = new RegExp(String.raw`^${escaped}(, \d+ events)?$`);
    await expect(this.page.getByTestId(MAP_TEST_IDS.map).getByRole('button', { name })).toHaveCount(0);
  }

  async expectTruncatedNotice(): Promise<void> {
    await expect(this.page.getByTestId(MAP_NOTICE_TEST_IDS.truncated)).toHaveText(TRUNCATED_NOTICE_COPY);
  }

  /** Presses the key (Tab by default) until the control has focus, so the test proves it is in the keyboard order. */
  private async tabTo(control: Locator, key: 'Tab' | 'Shift+Tab' = 'Tab'): Promise<void> {
    for (let presses = 0; presses < MAX_TAB_PRESSES; presses += 1) {
      await this.page.keyboard.press(key);
      if (await control.evaluate(element => element === document.activeElement)) break;
    }
    await expect(control).toBeFocused();
  }

  async chooseMapViewWithKeyboard(): Promise<void> {
    await this.tabTo(this.page.getByTestId(MAP_TEST_IDS.viewSwitchMap));
    await this.page.keyboard.press('Enter');
    await expect(this.region).toBeVisible();
  }

  /** Shift+Tab: the List button comes before the map and its pins in the page's order. */
  async chooseListViewWithKeyboard(): Promise<void> {
    await this.tabTo(this.page.getByTestId(MAP_TEST_IDS.viewSwitchList), 'Shift+Tab');
    await this.page.keyboard.press('Enter');
    await expect(this.region).toHaveCount(0);
  }

  async expectListIsCurrentView(): Promise<void> {
    await expect(this.page.getByTestId(MAP_TEST_IDS.viewSwitchList)).toHaveAttribute('aria-pressed', 'true');
  }

  /** By click: for scenarios that are not about the keyboard. */
  async openPin(venue: string, eventCount = 1): Promise<void> {
    await this.pin(venue, eventCount).click();
    await expect(this.page.getByTestId(POPUP_TEST_IDS.popup)).toBeVisible();
  }

  private readonly datesShown = new Map<string, RenderedDateRange>();

  /** Notes the dates each event in the open popup shows, then closes it so it cannot cover the next pin. */
  async closePopupNotingDates(): Promise<void> {
    for (const [name, days] of await this.readPopupDays()) this.datesShown.set(name, days);
    await this.page.getByTestId(POPUP_TEST_IDS.close).click();
    await expect(this.page.getByTestId(POPUP_TEST_IDS.popup)).toHaveCount(0);
  }

  /** The dates noted from every popup closed with `closePopupNotingDates`, by event name. */
  get datesShownInPopups(): ReadonlyMap<string, RenderedDateRange> {
    return this.datesShown;
  }

  async openPinWithKeyboard(venue: string, eventCount = 1): Promise<void> {
    await this.tabTo(this.pin(venue, eventCount));
    await this.page.keyboard.press('Enter');
    await expect(this.page.getByTestId(POPUP_TEST_IDS.popup)).toBeVisible();
  }

  /** Asserts the popup's heading, address and directions, then each event's name, types, link and own address. */
  async expectPopupFor(expected: ExpectedMapPopup): Promise<void> {
    const popup = this.page.getByTestId(POPUP_TEST_IDS.popup);
    await expect(popup.getByTestId(POPUP_TEST_IDS.venue)).toHaveText(expected.venue);
    await expect(popup.getByTestId(POPUP_TEST_IDS.address)).toHaveText(expected.address);
    await expect(popup.getByTestId(POPUP_TEST_IDS.directionsLink)).toHaveAttribute('href', expected.directionsUrl);
    const entries = popup.getByTestId(POPUP_TEST_IDS.event);
    await expect(entries).toHaveCount(expected.events.length);
    // Entries follow the popup's order (earliest start first), so they are read by position.
    for (const [index, event] of expected.events.entries()) {
      const entry = entries.nth(index);
      await expect(entry.getByTestId(POPUP_TEST_IDS.eventName)).toHaveText(event.name);
      await expect(entry.getByTestId(POPUP_TEST_IDS.eventTypes)).toHaveText(event.types);
      await expect(entry.getByTestId(POPUP_TEST_IDS.eventLink)).toHaveAttribute('href', event.moreInfoUrl);
      if (event.ownAddress) await expect(entry.getByTestId(POPUP_TEST_IDS.eventAddress)).toHaveText(event.ownAddress);
      else await expect(entry.getByTestId(POPUP_TEST_IDS.eventAddress)).toHaveCount(0);
    }
  }

  private get popup(): Locator {
    return this.page.getByTestId(POPUP_TEST_IDS.popup);
  }

  async expectPopupVenueAndAddress(expected: Pick<ExpectedMapPopup, 'venue' | 'address'>): Promise<void> {
    await expect(this.popup.getByTestId(POPUP_TEST_IDS.venue)).toHaveText(expected.venue);
    await expect(this.popup.getByTestId(POPUP_TEST_IDS.address)).toHaveText(expected.address);
  }

  /** The open popup's only event: its name and types as text, its dates as calendar days (compared with the card's). */
  async expectPopupEventShows(
    expected: Readonly<{ name: string; types: string }>,
    days: RenderedDateRange,
  ): Promise<void> {
    const entry = this.popup.getByTestId(POPUP_TEST_IDS.event);
    await expect(entry).toHaveCount(1);
    await expect(entry.getByTestId(POPUP_TEST_IDS.eventName)).toHaveText(expected.name);
    await expect(entry.getByTestId(POPUP_TEST_IDS.eventTypes)).toHaveText(expected.types);
    const shown = await entry.getByTestId(POPUP_TEST_IDS.eventDates).innerText();
    expect(parseRenderedDateRange(shown), 'days shown in the popup').toEqual(days);
  }

  /** The directions link and the event's own link point where the card's do. */
  async expectPopupLinks(expected: Readonly<{ directionsUrl: string; moreInfoUrl: string }>): Promise<void> {
    await expect(this.popup.getByTestId(POPUP_TEST_IDS.directionsLink)).toHaveAttribute('href', expected.directionsUrl);
    await expect(this.popup.getByTestId(POPUP_TEST_IDS.eventLink)).toHaveAttribute('href', expected.moreInfoUrl);
  }

  /** The days each event in the open popup shows, keyed by event name. */
  private async readPopupDays(): Promise<Map<string, RenderedDateRange>> {
    const entries = this.page.getByTestId(POPUP_TEST_IDS.popup).getByTestId(POPUP_TEST_IDS.event);
    const days = new Map<string, RenderedDateRange>();
    for (const entry of await entries.all()) {
      const name = await entry.getByTestId(POPUP_TEST_IDS.eventName).innerText();
      days.set(name, parseRenderedDateRange(await entry.getByTestId(POPUP_TEST_IDS.eventDates).innerText()));
    }
    return days;
  }

  /** On-screen offset in px from the reference pin's centre to the other's (x grows right, y grows down). */
  private async pinOffset(venue: string, referenceVenue: string): Promise<{ dx: number; dy: number }> {
    const [pin, reference] = await Promise.all([
      this.pin(venue, 1).boundingBox(),
      this.pin(referenceVenue, 1).boundingBox(),
    ]);
    if (!pin || !reference) throw new Error(`Pins for "${venue}" and "${referenceVenue}" must be on screen to measure`);
    return {
      dx: pin.x + pin.width / 2 - (reference.x + reference.width / 2),
      dy: pin.y + pin.height / 2 - (reference.y + reference.height / 2),
    };
  }

  /**
   * The map fits its bounds on load, so positions are re-read until they settle. Direction and the
   * vertical / horizontal ratio are both checked: swapped latitude and longitude keeps the direction.
   */
  async expectPinSouthEastOf(venue: string, referenceVenue: string, ratio: RatioBounds): Promise<void> {
    await this.expectPinFor(venue);
    await this.expectPinFor(referenceVenue);
    await expect(async () => {
      const { dx, dy } = await this.pinOffset(venue, referenceVenue);
      expect(dx, `"${venue}" should be right of "${referenceVenue}"`).toBeGreaterThan(0);
      expect(dy, `"${venue}" should be below "${referenceVenue}"`).toBeGreaterThan(0);
      expect(dy / dx, 'vertical / horizontal distance').toBeGreaterThanOrEqual(ratio.min);
      expect(dy / dx, 'vertical / horizontal distance').toBeLessThanOrEqual(ratio.max);
    }).toPass({ timeout: TIMEOUTS.expect });
  }

  /**
   * The map fits its bounds on load, so positions are re-read until they settle. Direction and the
   * vertical / horizontal ratio are both checked: swapped latitude and longitude keeps the direction.
   */
  async expectPinNorthEastOf(venue: string, referenceVenue: string, ratio: RatioBounds): Promise<void> {
    await this.expectPinFor(venue);
    await this.expectPinFor(referenceVenue);
    await expect(async () => {
      const { dx, dy } = await this.pinOffset(venue, referenceVenue);
      expect(dx, `"${venue}" should be right of "${referenceVenue}"`).toBeGreaterThan(0);
      expect(dy, `"${venue}" should be above "${referenceVenue}"`).toBeLessThan(0);
      expect(-dy / dx, 'vertical / horizontal distance').toBeGreaterThanOrEqual(ratio.min);
      expect(-dy / dx, 'vertical / horizontal distance').toBeLessThanOrEqual(ratio.max);
    }).toPass({ timeout: TIMEOUTS.expect });
  }

  /** The map's box lies inside the screen's width: nothing is clipped on either side. */
  async expectMapWithinScreenWidth(): Promise<void> {
    await expect(async () => {
      const box = await this.region.boundingBox();
      const screenWidth = await this.page.evaluate(() => document.documentElement.clientWidth);
      expect(box, 'map region box').not.toBeNull();
      expect(box?.x, 'map left edge').toBeGreaterThanOrEqual(0);
      expect((box?.x ?? 0) + (box?.width ?? 0), `map right edge (screen width ${screenWidth})`).toBeLessThanOrEqual(
        screenWidth,
      );
    }).toPass({ timeout: TIMEOUTS.expect });
  }
}
