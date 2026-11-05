import { expect, type Locator, type Page } from '@playwright/test';
import type { County } from '@api/support';
import { TIMEOUTS } from '@shared/config/timeouts';
import { gotoAppShell, gotoRoute } from '@ui/support';
import {
  MAP_CENTRE_TOLERANCE_PX,
  MAP_CHUNK_URL_PATTERN,
  MAP_POPUP_CONTAINER_SELECTOR,
  MAP_REGION_NAME,
  MAP_TILE_SELECTOR,
  MAP_TILE_URL_PATTERN,
  MAP_TEST_IDS,
  MIN_PIN_SPREAD_PX,
  NORTH_EAST_RATIO_BOUNDS,
  STREET_ZOOM_BOUNDS,
  TEST_IDS,
  THEME_STORAGE_KEY,
  TILES_FAILED_COPY,
} from './gyms.constants';
import { Theme } from '../sections/header.constants';

export class GymsMapPage {
  constructor(private readonly page: Page) {}

  /** The `load` event has fired and the browser has had an idle moment, so idle-time prefetches have started. */
  private async waitUntilPageSettled(): Promise<void> {
    await this.page.waitForLoadState('load');
    await this.page.evaluate(
      () =>
        new Promise<void>(resolve => {
          if ('requestIdleCallback' in window)
            window.requestIdleCallback(() => {
              resolve();
            });
          else resolve();
        }),
    );
  }

  /** Waits for the page to settle, then checks the recorded request URLs for map code and tiles. */
  async expectNoMapDownloaded(requestedUrls: readonly string[]): Promise<void> {
    await this.waitUntilPageSettled();
    expect(
      requestedUrls.filter(url => MAP_CHUNK_URL_PATTERN.test(url)),
      'map code requested',
    ).toEqual([]);
    expect(
      requestedUrls.filter(url => MAP_TILE_URL_PATTERN.test(url)),
      'map tiles requested',
    ).toEqual([]);
  }

  async expectMapCodeRequested(requestedUrls: readonly string[]): Promise<void> {
    await expect
      .poll(() => requestedUrls.filter(url => MAP_CHUNK_URL_PATTERN.test(url)).length, { message: 'map code requests' })
      .toBeGreaterThan(0);
  }

  async expectMapTilesRequested(requestedUrls: readonly string[]): Promise<void> {
    await expect
      .poll(() => requestedUrls.filter(url => MAP_TILE_URL_PATTERN.test(url)).length, {
        message: 'map tile requests',
      })
      .toBeGreaterThan(0);
  }

  private get region(): Locator {
    return this.page.getByRole('region', { name: MAP_REGION_NAME });
  }

  private pin(gymName: string): Locator {
    return this.page.getByTestId(MAP_TEST_IDS.map).getByRole('button', { name: gymName, exact: true });
  }

  /** On-screen offset in px from the first pin's centre to the second's (x grows right, y grows down). */
  private async pinOffset(firstGym: string, secondGym: string): Promise<{ dx: number; dy: number }> {
    const [first, second] = await Promise.all([this.pin(firstGym).boundingBox(), this.pin(secondGym).boundingBox()]);
    if (!first || !second) throw new Error(`Pins for "${firstGym}" and "${secondGym}" must be on screen to measure`);
    return {
      dx: second.x + second.width / 2 - (first.x + first.width / 2),
      dy: second.y + second.height / 2 - (first.y + first.height / 2),
    };
  }

  /** On-screen distance in px between the centres of two named pins. Call once both pins are visible. */
  async pinDistance(firstGym: string, secondGym: string): Promise<number> {
    const { dx, dy } = await this.pinOffset(firstGym, secondGym);
    return Math.hypot(dx, dy);
  }

  /**
   * The map fits its bounds on load, so positions are re-read until they settle.
   * Direction and vertical/horizontal ratio are both checked: swapped lat/lng keeps the direction.
   */
  async expectPinNorthEastOf(gymName: string, referenceGym: string): Promise<void> {
    await this.expectPinFor(gymName);
    await this.expectPinFor(referenceGym);
    await expect(async () => {
      const { dx, dy } = await this.pinOffset(referenceGym, gymName);
      expect(dx, `"${gymName}" should be right of "${referenceGym}"`).toBeGreaterThan(0);
      expect(dy, `"${gymName}" should be above "${referenceGym}"`).toBeLessThan(0);
      expect(-dy / dx, 'vertical / horizontal distance').toBeGreaterThanOrEqual(NORTH_EAST_RATIO_BOUNDS.min);
      expect(-dy / dx, 'vertical / horizontal distance').toBeLessThanOrEqual(NORTH_EAST_RATIO_BOUNDS.max);
    }).toPass({ timeout: TIMEOUTS.expect });
  }

  async expectPinsFurtherApartThan(firstGym: string, secondGym: string, beforePx: number): Promise<void> {
    await expect
      .poll(() => this.pinDistance(firstGym, secondGym), {
        message: `distance between "${firstGym}" and "${secondGym}"`,
      })
      .toBeGreaterThan(beforePx + MIN_PIN_SPREAD_PX);
  }

  /** Unlike `toBeVisible`, this fails for a pin that is clipped out of the map's frame. */
  async expectPinInView(gymName: string): Promise<void> {
    await expect(this.pin(gymName)).toBeInViewport();
  }

  /** The list's filter helper waits for cards, which the map view does not show. */
  async filterByCounty(county: County): Promise<void> {
    const select = this.page.getByTestId(TEST_IDS.countySelect);
    await select.selectOption(county);
    await expect(select).toHaveValue(county);
  }

  /** Stores the theme before any page script runs, as the app reads it on boot. Call before navigating. */
  async chooseThemeBeforeLoad(theme: Theme): Promise<void> {
    await this.page.addInitScript(
      ({ key, value }) => {
        localStorage.setItem(key, value);
      },
      {
        key: THEME_STORAGE_KEY,
        value: theme,
      },
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

  async goToMap(): Promise<void> {
    await gotoRoute(this.page, '/gyms?view=map', this.region);
  }

  async goToWithQuery(query: string): Promise<void> {
    await gotoRoute(this.page, `/gyms?view=map&${query}`, this.region);
  }

  /** Opens a map link without waiting for the map: with the map off the page shows the list instead. */
  async openMapLinkWithQuery(query: string): Promise<void> {
    await gotoAppShell(this.page, `/gyms?view=map&${query}`);
  }

  /** The path only: the app leaves `?view=map` in the URL, which the spec does not require either way. */
  async expectOnGymsPath(): Promise<void> {
    await expect(this.page).toHaveURL(url => url.pathname === '/gyms');
  }

  async expectViewSwitchAbsent(): Promise<void> {
    await expect(this.page.getByTestId(MAP_TEST_IDS.viewSwitch)).toHaveCount(0);
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

  async expectListIsCurrentView(): Promise<void> {
    await expect(this.page.getByTestId(MAP_TEST_IDS.viewSwitchList)).toHaveAttribute('aria-pressed', 'true');
  }

  async expectMapNotDisplayed(): Promise<void> {
    await expect(this.region).toHaveCount(0);
  }

  async expectListUrlFor(county: County): Promise<void> {
    await expect(this.page).toHaveURL(
      url => url.pathname === '/gyms' && url.searchParams.get('county') === county && !url.searchParams.has('view'),
    );
  }

  async expectPinFor(gymName: string): Promise<void> {
    await expect(this.pin(gymName)).toBeVisible();
  }

  /** The open pin's popup. Public for the aria snapshot of its accessible structure. */
  get popup(): Locator {
    return this.page.getByTestId(MAP_TEST_IDS.popup);
  }

  async openPinFor(gymName: string): Promise<void> {
    await this.pin(gymName).click();
    await expect(this.popup).toBeVisible();
  }

  /**
   * Leaflet paints tiles with `mix-blend-mode: plus-lighter`, a mode axe cannot blend: its contrast and
   * link rules crash and skip the whole page. Setting tiles to `normal` lets those rules run. Excludes nothing.
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

  async expectPopupDetails(expected: { name: string; county: string; address: string }): Promise<void> {
    await expect(this.popup.getByTestId(MAP_TEST_IDS.popupName)).toHaveText(expected.name);
    await expect(this.popup.getByTestId(MAP_TEST_IDS.popupCounty)).toHaveText(expected.county);
    await expect(this.popup.getByTestId(MAP_TEST_IDS.popupAddress)).toHaveText(expected.address);
  }

  /** Both links open in a new tab and must not leak the opener. */
  async expectPopupLinks(expected: { website: string; directions: string }): Promise<void> {
    const links = [
      { link: this.popup.getByTestId(MAP_TEST_IDS.popupWebsiteLink), href: expected.website },
      { link: this.popup.getByTestId(MAP_TEST_IDS.popupDirectionsLink), href: expected.directions },
    ];
    for (const { link, href } of links) {
      await expect(link).toHaveAttribute('href', href);
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  }

  /** Offset in px from the map region's centre to the gym's pin centre (x grows right, y grows down). */
  private async pinOffsetFromMapCentre(gymName: string): Promise<{ dx: number; dy: number }> {
    const [pin, region] = await Promise.all([this.pin(gymName).boundingBox(), this.region.boundingBox()]);
    if (!pin || !region) throw new Error(`Pin for "${gymName}" and the map must be on screen to measure`);
    return {
      dx: pin.x + pin.width / 2 - (region.x + region.width / 2),
      dy: pin.y + pin.height / 2 - (region.y + region.height / 2),
    };
  }

  /** Zoom level `z` of the tiles shown (tile URLs are .../{z}/{x}/{y}.png). While zooming, old and new tiles coexist, so the highest wins. */
  private async tileZoom(): Promise<number> {
    const sources = await this.page
      .getByTestId(MAP_TEST_IDS.map)
      .locator(MAP_TILE_SELECTOR)
      .evaluateAll(tiles => tiles.map(tile => tile.getAttribute('src') ?? ''));
    const zooms = sources
      .map(src => Number(/\/(\d+)\/\d+\/\d+\.png/.exec(src)?.[1]))
      .filter(zoom => !Number.isNaN(zoom));
    return zooms.length ? Math.max(...zooms) : Number.NaN;
  }

  /** Before a search the map shows all of Ireland, well short of street level. */
  async expectCountryLevelZoom(): Promise<void> {
    await expect.poll(() => this.tileZoom(), { message: 'map tile zoom level' }).toBeLessThan(STREET_ZOOM_BOUNDS.min);
  }

  async expectOnlyPin(gymName: string): Promise<void> {
    await expect(this.page.getByTestId(MAP_TEST_IDS.pin)).toHaveCount(1);
    await expect(this.page.getByTestId(MAP_TEST_IDS.pin)).toHaveAccessibleName(gymName);
  }

  /** Street-level zoom (not maximum), pin centred on both axes. Polled: the map fits its bounds after results change. */
  async expectZoomedToPin(gymName: string): Promise<void> {
    await expect
      .poll(() => this.tileZoom(), { message: 'map tile zoom level' })
      .toBeGreaterThanOrEqual(STREET_ZOOM_BOUNDS.min);
    await expect.poll(() => this.tileZoom(), { message: 'map tile zoom level' }).toBeLessThan(STREET_ZOOM_BOUNDS.max);
    await expect
      .poll(async () => Math.abs((await this.pinOffsetFromMapCentre(gymName)).dx), {
        message: `horizontal offset of "${gymName}" from the map centre`,
      })
      .toBeLessThanOrEqual(MAP_CENTRE_TOLERANCE_PX);
    await expect
      .poll(async () => Math.abs((await this.pinOffsetFromMapCentre(gymName)).dy), {
        message: `vertical offset of "${gymName}" from the map centre`,
      })
      .toBeLessThanOrEqual(MAP_CENTRE_TOLERANCE_PX);
  }

  private get tilesFailedNotice(): Locator {
    return this.page.getByTestId(MAP_TEST_IDS.noticeTilesFailed);
  }

  /** The app shows the notice on the first failed tile, so no count of failures is awaited. */
  async expectTilesFailedNotice(): Promise<void> {
    await expect(this.tilesFailedNotice).toBeVisible();
    await expect(this.tilesFailedNotice).toContainText(TILES_FAILED_COPY.message);
    await expect(this.tilesFailedNotice.getByRole('link', { name: TILES_FAILED_COPY.listLink })).toBeVisible();
  }

  async followTilesFailedListLink(): Promise<void> {
    await this.tilesFailedNotice.getByRole('link', { name: TILES_FAILED_COPY.listLink }).click();
  }

  async expectPopupName(name: string): Promise<void> {
    await expect(this.popup.getByTestId(MAP_TEST_IDS.popupName)).toHaveText(name);
  }

  async expectNoPinFor(gymName: string): Promise<void> {
    await expect(this.pin(gymName)).toHaveCount(0);
  }
}
