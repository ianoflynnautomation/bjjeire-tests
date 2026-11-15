import { expect, type Locator, type Page } from '@playwright/test';
import { gotoRoute } from '@ui/support';
import { TOURNAMENT_ADMIN_COPY, TOURNAMENT_ADMIN_TEST_IDS as IDS } from './tournaments.constants';

/** The organiser's management screen, behind the organiser sign-in gate. */
export class TournamentAdminPage {
  constructor(private readonly page: Page) {}

  private get signInPrompt(): Locator {
    return this.page.getByTestId(IDS.signIn);
  }

  /** The gate's prompt is the anchor: an anonymous browser holds no organiser account. */
  async goTo(): Promise<void> {
    await gotoRoute(this.page, TOURNAMENT_ADMIN_COPY.route, this.signInPrompt);
  }

  async expectSignInPrompt(): Promise<void> {
    await expect(this.signInPrompt.getByRole('heading', { name: TOURNAMENT_ADMIN_COPY.signInHeading })).toBeVisible();
    await expect(this.signInPrompt.getByRole('button', { name: TOURNAMENT_ADMIN_COPY.signInButton })).toBeVisible();
  }

  async expectNoTournamentListed(): Promise<void> {
    await expect(this.page.getByTestId(IDS.listItem)).toHaveCount(0);
  }
}
