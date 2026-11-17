import { expect, type Page } from '@playwright/test';
import { MY_SIGN_UPS_COPY, MY_SIGN_UPS_TEST_IDS as IDS } from './competitions.constants';

/** The signed-in competitor's own sign-ups (`/account/signups`). */
export class MySignUpsPage {
  constructor(private readonly page: Page) {}

  async expectEmptyMessage(): Promise<void> {
    await expect(
      this.page.getByTestId(IDS.root).getByRole('heading', { name: MY_SIGN_UPS_COPY.heading }),
    ).toBeVisible();
    await expect(this.page.getByTestId(IDS.empty)).toContainText(MY_SIGN_UPS_COPY.empty);
  }

  async expectNoSignUpsListed(): Promise<void> {
    await expect(this.page.getByTestId(IDS.row)).toHaveCount(0);
  }
}
