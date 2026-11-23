import { expect, type Locator, type Page } from '@playwright/test';
import { expectImageLoaded } from '@ui/support';
import { PRODUCT_PAGE_TEST_IDS } from './stores.constants';

/** A merch product page (`/shop/products/<slug>`), reached from a merch card. */
export class ProductPage {
  constructor(private readonly page: Page) {}

  private get root(): Locator {
    return this.page.getByTestId(PRODUCT_PAGE_TEST_IDS.root);
  }

  /** Every size is listed, in order (a sold-out size is listed too, marked as such), and the first photo has loaded. */
  async expectSizesAndPhoto(sizes: readonly string[]): Promise<void> {
    await expect(this.root.getByTestId(PRODUCT_PAGE_TEST_IDS.sizes).getByTestId(PRODUCT_PAGE_TEST_IDS.size)).toHaveText(
      sizes.map(size => new RegExp(`^${size}(Sold out)?$`)),
    );
    await expectImageLoaded(this.root.getByTestId(PRODUCT_PAGE_TEST_IDS.photo).first());
  }
}
