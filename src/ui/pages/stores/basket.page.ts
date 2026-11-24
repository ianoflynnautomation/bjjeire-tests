import { expect, type Locator, type Page } from '@playwright/test';
import { gotoRoute } from '@ui/support';
import { BASKET_ROUTE, BASKET_TEST_IDS, SHOP_ROUTE } from './stores.constants';

/** The merch basket (`/shop/basket`) and its icon in the navigation. */
export class BasketPage {
  constructor(private readonly page: Page) {}

  private get root(): Locator {
    return this.page.getByTestId(BASKET_TEST_IDS.root);
  }

  /** Opens the basket address directly. */
  async goTo(): Promise<void> {
    await gotoRoute(this.page, BASKET_ROUTE, this.root);
  }

  private get empty(): Locator {
    return this.root.getByTestId(BASKET_TEST_IDS.empty);
  }

  async expectEmptyBasket(): Promise<void> {
    await expect(this.empty).toBeVisible();
  }

  /** The empty basket links back to Shop; following it leads to `/shop`. */
  async expectLinkBackToShop(): Promise<void> {
    const link = this.empty.getByRole('link');
    await expect(link).toHaveAttribute('href', SHOP_ROUTE);
  }

  async expectNoCheckoutControl(): Promise<void> {
    await expect(this.root.getByTestId(BASKET_TEST_IDS.checkout)).toHaveCount(0);
  }

  /** Follows the basket icon in the navigation. */
  async openFromNavigation(): Promise<void> {
    await this.page.getByTestId(BASKET_TEST_IDS.badge).click();
  }

  /** The basket holds exactly one line: this product, in this size, with this quantity. */
  async expectSingleLine(name: string, size: string, quantity: number): Promise<void> {
    const lines = this.root.getByTestId(BASKET_TEST_IDS.line);
    await expect(lines).toHaveCount(1);
    await expect(lines.getByTestId(BASKET_TEST_IDS.lineName)).toHaveText(name);
    await expect(lines.getByTestId(BASKET_TEST_IDS.lineSize)).toHaveText(`Size ${size}`);
    await expect(lines.getByTestId(BASKET_TEST_IDS.lineQuantity)).toHaveValue(String(quantity));
  }

  async expectNavigationCount(items: number): Promise<void> {
    await expect(this.page.getByTestId(BASKET_TEST_IDS.badgeCount)).toHaveText(String(items));
  }
}
