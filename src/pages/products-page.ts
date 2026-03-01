import { expect } from '@playwright/test';
import { gotoURL } from '../utils/action-utils';
import { BasePage } from './base-page';

export class ProductsPage extends BasePage {
  private readonly inventoryContainer = () => this.page.locator('#inventory_container').nth(0);

  async navigate(): Promise<void> {
    await gotoURL(this.page, '/inventory.html');
  }

  async verifyIsLoaded(): Promise<void> {
    await expect(this.inventoryContainer()).toBeVisible();
  }
}
