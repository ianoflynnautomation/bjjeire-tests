import { expect, type Locator, type Page } from '@playwright/test';
import { gotoRoute } from '@ui/support';
import {
  BJJEIRE_COMPETITION_ADMIN_COPY as COPY,
  BJJEIRE_COMPETITION_ADMIN_TEST_IDS as IDS,
} from './competitions.constants';

/** The organiser's BJJ Éire competition management screen (`/admin/competitions`), behind the organiser sign-in gate. */
export class BjjEireCompetitionAdminPage {
  constructor(private readonly page: Page) {}

  private get signInPrompt(): Locator {
    return this.page.getByTestId(IDS.signIn);
  }

  /** The gate's prompt is the anchor: an anonymous browser holds no organiser account. */
  async goTo(): Promise<void> {
    await gotoRoute(this.page, COPY.route, this.signInPrompt);
  }

  async expectSignInPrompt(): Promise<void> {
    await expect(this.signInPrompt.getByRole('heading', { name: COPY.signInHeading })).toBeVisible();
    await expect(this.signInPrompt.getByRole('button', { name: COPY.signInButton })).toBeVisible();
  }

  async expectNoCompetitionListed(): Promise<void> {
    await expect(this.page.getByTestId(IDS.listItem)).toHaveCount(0);
  }
}
