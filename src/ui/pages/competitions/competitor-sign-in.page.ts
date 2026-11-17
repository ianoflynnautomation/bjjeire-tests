import { expect, type Locator, type Page } from '@playwright/test';
import {
  COMPETITOR_SIGN_IN_COPY,
  COMPETITOR_SIGN_IN_PROMPT,
  COMPETITOR_SIGN_IN_TEST_IDS as IDS,
  LOCAL_COMPETITOR_SESSION_KEY,
  SESSION_SEEDED_MARKER,
} from './competitions.constants';

/** The competitor sign-in the app shows over a page that needs an account (the local email form on the local stack). */
export class CompetitorSignInPage {
  constructor(private readonly page: Page) {}

  private get root(): Locator {
    return this.page.getByTestId(IDS.root);
  }

  /**
   * Opens the pages already signed in: seeds the SPA's local session before it loads. Call it before navigating.
   * It seeds once per tab (a marker in the same storage), so a later reload does not bring back a session the
   * test has since ended or deleted.
   */
  async startSignedIn(session: Readonly<{ accessToken: string; expiresAt: string }>): Promise<void> {
    await this.page.addInitScript(
      ([key, value, marker]) => {
        if (!key || !value || !marker || window.sessionStorage.getItem(marker)) return;
        window.sessionStorage.setItem(key, value);
        window.sessionStorage.setItem(marker, 'seeded');
      },
      [LOCAL_COMPETITOR_SESSION_KEY, JSON.stringify(session), SESSION_SEEDED_MARKER],
    );
  }

  async expectAskedToSignIn(): Promise<void> {
    await expect(this.root.getByRole('heading', { name: COMPETITOR_SIGN_IN_COPY.heading, exact: true })).toBeVisible();
  }

  async expectOfferedSignInOrRegistration(): Promise<void> {
    await expect(this.root.getByTestId(IDS.button)).toHaveText(COMPETITOR_SIGN_IN_PROMPT.button);
  }

  /** Signs in through the local form with this email; the same email is always the same competitor. */
  async signInWithEmail(email: string): Promise<void> {
    await this.root.getByLabel(COMPETITOR_SIGN_IN_COPY.emailLabel).fill(email);
    await this.root.getByTestId(IDS.button).click();
  }
}
