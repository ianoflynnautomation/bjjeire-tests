import { expect, type Locator, type Page } from '@playwright/test';
import { gotoRoute } from '@ui/support';
import { SHOP_ADMIN } from './stores.constants';

/** The organiser's shop admin (`/admin/shop`), behind the organiser sign-in gate. */
export class ShopAdminPage {
  constructor(private readonly page: Page) {}

  private get signInPrompt(): Locator {
    return this.page.getByTestId(SHOP_ADMIN.signInTestId);
  }

  /** The gate's prompt is the anchor: an anonymous browser holds no organiser account. */
  async goTo(): Promise<void> {
    await gotoRoute(this.page, SHOP_ADMIN.route, this.signInPrompt);
  }

  async expectSignInPrompt(): Promise<void> {
    await expect(this.signInPrompt.getByRole('heading', { name: SHOP_ADMIN.signInHeading })).toBeVisible();
    await expect(this.signInPrompt.getByRole('button', { name: SHOP_ADMIN.signInButton })).toBeVisible();
  }

  async expectNoProductListed(): Promise<void> {
    for (const testId of SHOP_ADMIN.listTestIds) {
      await expect(this.page.getByTestId(testId)).toHaveCount(0);
    }
  }

  /** The create form, its heading and buttons, and the product status controls. */
  async expectNoManagementControls(): Promise<void> {
    for (const testId of SHOP_ADMIN.controlTestIds) {
      await expect(this.page.getByTestId(testId)).toHaveCount(0);
    }
    await expect(this.page.getByRole('heading', { name: SHOP_ADMIN.createHeading })).toHaveCount(0);
    for (const name of SHOP_ADMIN.controlButtons) {
      await expect(this.page.getByRole('button', { name })).toHaveCount(0);
    }
  }
}
