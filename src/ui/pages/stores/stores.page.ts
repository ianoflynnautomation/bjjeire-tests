import { expect, type Locator, type Page } from '@playwright/test';
import { expectNoDataState } from '../common/empty.page';
import { expectAddress, expectImageLoaded, gotoRoute } from '@ui/support';
import { ListPage } from '../common/list-page';
import { getStoreCardData } from './stores.card.page';
import {
  MERCH_CARD_TEST_IDS,
  MERCH_SECTION,
  NO_DATA_COPY,
  PRODUCTS_ROUTE,
  NO_SEARCH_RESULTS_COPY,
  SHOP_NAV,
  TEST_IDS,
  websiteLinkName,
} from './stores.constants';
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

  /**
   * Open Shop and wait until the catalogue request has been answered with `status`, so a later absence check follows a
   * real failed request, not one still in flight (or never made).
   */
  async goToAfterCatalogueAnswers(status: number): Promise<void> {
    const answered = this.page.waitForResponse(
      response => PRODUCTS_ROUTE.test(response.url()) && response.status() === status,
    );
    await this.goTo();
    await answered;
  }

  private get merchSection(): Locator {
    return this.page.getByTestId(MERCH_SECTION.testId);
  }

  async expectMerchSection(): Promise<void> {
    await expect(this.merchSection.getByRole('heading', { name: MERCH_SECTION.heading })).toBeVisible();
  }

  async expectNoMerchSection(): Promise<void> {
    await expect(this.merchSection).toHaveCount(0);
    await expect(this.page.getByRole('heading', { name: MERCH_SECTION.heading })).toHaveCount(0);
  }

  private merchCard(name: string): Locator {
    return this.merchSection.getByTestId(MERCH_CARD_TEST_IDS.card).filter({ hasText: name });
  }

  /** The seeded product's card names it, shows its price, and its photo has loaded. */
  async expectMerchCard(name: string, price: string): Promise<void> {
    const card = this.merchCard(name);
    await expect(card.getByTestId(MERCH_CARD_TEST_IDS.name)).toHaveText(name);
    await expect(card.getByTestId(MERCH_CARD_TEST_IDS.price)).toHaveText(price);
    await expectImageLoaded(card.getByTestId(MERCH_CARD_TEST_IDS.image));
  }

  async openMerchProduct(name: string): Promise<void> {
    await this.merchCard(name).getByTestId(MERCH_CARD_TEST_IDS.link).click();
  }

  async expectNoErrorAlert(): Promise<void> {
    await expect(this.page.getByRole('alert')).toHaveCount(0);
  }

  async expectCardListed(name: string): Promise<void> {
    await expect(this.card(name)).toBeVisible();
  }

  async expectNoResultsMessage(): Promise<void> {
    await expectNoDataState(this.page, NO_SEARCH_RESULTS_COPY);
  }

  override async expectNoResults(): Promise<void> {
    await super.expectNoResults();
    await expectNoDataState(this.page, NO_SEARCH_RESULTS_COPY);
  }
}
