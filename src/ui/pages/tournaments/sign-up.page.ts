import { expect, type Locator, type Page } from '@playwright/test';
import { SIGN_UP_PAGE_COPY, SIGN_UP_PAGE_TEST_IDS as IDS } from './tournaments.constants';

/** The sign-up page for one tournament. Read-only here: the form is never submitted (a sign-up cannot be given back). */
export class SignUpPage {
  constructor(private readonly page: Page) {}

  private get root(): Locator {
    return this.page.getByTestId(IDS.root);
  }

  async expectForTournament(name: string): Promise<void> {
    await expect(this.root).toBeVisible();
    await expect(this.page.getByTestId(IDS.heading)).toHaveText(`${SIGN_UP_PAGE_COPY.headingPrefix} ${name}`);
  }

  async expectDivisionsOffered(labels: readonly string[]): Promise<void> {
    await expect(this.page.getByTestId(IDS.divisionOption)).toHaveText([...labels]);
  }

  /** None of these divisions is offered, whatever else is. */
  async expectDivisionsNotOffered(labels: readonly string[]): Promise<void> {
    for (const label of labels) {
      await expect(this.page.getByTestId(IDS.divisionOption).filter({ hasText: label })).toHaveCount(0);
    }
  }

  async expectEntryFee(fee: string): Promise<void> {
    await expect(this.page.getByTestId(IDS.fee)).toHaveText(fee);
  }

  async expectToldMustBeEighteen(): Promise<void> {
    await expect(this.page.getByTestId(IDS.under18)).toHaveText(SIGN_UP_PAGE_COPY.underEighteen);
  }

  /** No division to choose and no way to continue to payment. */
  async expectNothingToChooseOrPay(): Promise<void> {
    await expect(this.page.getByTestId(IDS.divisionOption)).toHaveCount(0);
    await expect(this.page.getByTestId(IDS.submit)).toHaveCount(0);
  }

  async expectNotToldMustBeEighteen(): Promise<void> {
    await expect(this.root).toBeVisible();
    await expect(this.page.getByTestId(IDS.under18)).toHaveCount(0);
  }
}
