import { expect, type Locator, type Page } from '@playwright/test';
import { expectNoDataState } from '../common/empty.page';
import { expectAddress, gotoRoute } from '@ui/support';
import { ListPage } from '../common/list-page';
import { getStoreCardData } from './stores.card.page';
import { NO_DATA_COPY, NO_SEARCH_RESULTS_COPY, SHOP_NAV, TEST_IDS, websiteLinkName } from './stores.constants';
import type { StoreCard } from './stores.types';

export class StoresPage extends ListPage<StoreCard> {
  constructor(page: Page) {
    super(page, { route: '/shop', testIds: TEST_IDS, noDataCopy: NO_DATA_COPY });
  }

  protected readCardData(card: Locator): Promise<StoreCard> {
    return getStoreCardData(card);
  }

  /** Open a retired Stores address and wait for the Shop header to mount after the redirect. */
  async goToOldAddress(address: string): Promise<void> {
    await gotoRoute(this.page, address, this.header);
  }

  /** The tab title is `title`. */
  async expectTabTitle(title: string): Promise<void> {
    await expect(this.page).toHaveTitle(title);
  }

  async expectOnShopPage(): Promise<void> {
    await expectAddress(this.page, SHOP_NAV.path);
  }

  /** Exactly one card is listed and it is named `name`. */
  async expectOnlyCardNamed(name: string): Promise<void> {
    await this.expectResultCount(1);
    await expect(this.card(name).getByTestId(TEST_IDS.cardName)).toHaveText(name);
  }

  async expectCardWebsiteLink(name: string, url: string): Promise<void> {
    await expect(this.card(name).getByRole('link', { name: websiteLinkName(name) })).toHaveAttribute('href', url);
  }

  async expectCardWithoutDescription(name: string): Promise<void> {
    await expect(this.card(name)).toBeVisible();
    await expect(this.card(name).getByTestId(TEST_IDS.description)).toHaveCount(0);
  }

  /** The card shows the placeholder tile and no logo image. */
  async expectCardLogoFallback(name: string): Promise<void> {
    const card = this.card(name);
    await expect(card).toBeVisible();
    await expect(card.getByTestId(TEST_IDS.logoFallback)).toBeVisible();
    await expect(card.getByTestId(TEST_IDS.logo)).toHaveCount(0);
  }

  async expectNoResultsMessage(): Promise<void> {
    await expectNoDataState(this.page, NO_SEARCH_RESULTS_COPY);
  }

  override async expectNoResults(): Promise<void> {
    await super.expectNoResults();
    await expectNoDataState(this.page, NO_SEARCH_RESULTS_COPY);
  }
}
