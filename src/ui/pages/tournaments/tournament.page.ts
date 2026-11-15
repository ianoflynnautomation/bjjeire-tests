import { expect, type Locator, type Page } from '@playwright/test';
import { gotoRoute } from '@ui/support';
import {
  SIGN_UP_CONTROL_PATTERN,
  TOURNAMENT_NOT_FOUND_COPY,
  TOURNAMENT_PAGE_COPY,
  TOURNAMENT_PAGE_TEST_IDS as IDS,
} from './tournaments.constants';

/** One tournament's public page. */
export class TournamentPage {
  constructor(private readonly page: Page) {}

  private get root(): Locator {
    return this.page.getByTestId(IDS.root);
  }

  private get registrationSection(): Locator {
    return this.page.getByTestId(IDS.registrationStatus);
  }

  /** A direct load by address. Only the deep-link scenario uses it; every other one arrives from the list. */
  async goToAddress(slug: string): Promise<void> {
    await gotoRoute(this.page, `/tournaments/${slug}`, this.root);
  }

  /** A direct load of an address no tournament has: there is no tournament page to wait for. */
  async goToUnknownAddress(slug: string): Promise<void> {
    await gotoRoute(this.page, `/tournaments/${slug}`, this.notFoundHeading);
  }

  private get notFoundHeading(): Locator {
    return this.page
      .getByTestId(IDS.notFound)
      .getByRole('heading', { name: TOURNAMENT_NOT_FOUND_COPY.title, exact: true });
  }

  async expectNotFound(): Promise<void> {
    await expect(this.notFoundHeading).toBeVisible();
    await expect(this.root).toHaveCount(0);
  }

  async expectBackLinkToList(): Promise<void> {
    const link = this.page
      .getByTestId(IDS.notFound)
      .getByRole('link', { name: TOURNAMENT_NOT_FOUND_COPY.backLink, exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/tournaments');
  }

  async expectOpen(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  async expectName(name: string): Promise<void> {
    await expect(this.page.getByTestId(IDS.name)).toHaveText(name);
  }

  async expectDayAndVenue(day: string, venue: string): Promise<void> {
    await expect(this.page.getByTestId(IDS.date)).toHaveText(day);
    await expect(this.page.getByTestId(IDS.venue)).toContainText(venue);
  }

  async expectFeePerDivision(fee: string): Promise<void> {
    await expect(this.page.getByTestId(IDS.fee)).toHaveText(`${fee} ${TOURNAMENT_PAGE_COPY.feeNote}`);
  }

  /** The window as the page words it: `<opens> to <closes> (Irish time)`. */
  async expectRegistrationWindow(opens: string, closes: string): Promise<void> {
    const { windowSeparator, timeZoneNote } = TOURNAMENT_PAGE_COPY;
    await expect(this.page.getByTestId(IDS.window)).toHaveText(
      `${opens} ${windowSeparator} ${closes} (${timeZoneNote})`,
    );
  }

  /** Just the two times, in the page's own wording, without the label. */
  async expectWindowTimes(opens: string, closes: string): Promise<void> {
    await expect(this.page.getByTestId(IDS.window)).toContainText(
      `${opens} ${TOURNAMENT_PAGE_COPY.windowSeparator} ${closes}`,
    );
  }

  async expectWindowLabelledIrishTime(): Promise<void> {
    await expect(this.page.getByTestId(IDS.window)).toContainText(`(${TOURNAMENT_PAGE_COPY.timeZoneNote})`);
  }

  async expectRegistrationBadge(label: string): Promise<void> {
    await expect(this.registrationSection.getByText(label, { exact: true })).toBeVisible();
  }

  async expectRegistrationOpensOn(opens: string): Promise<void> {
    await expect(this.page.getByTestId(IDS.registrationMessage)).toHaveText(
      `${TOURNAMENT_PAGE_COPY.opensOnPrefix} ${opens}.`,
    );
  }

  async expectRegistrationClosedMessage(): Promise<void> {
    await expect(this.page.getByTestId(IDS.registrationMessage)).toHaveText(TOURNAMENT_PAGE_COPY.closed);
  }

  /** No button or link in the registration section: the page offers nothing to sign up with. */
  async expectNoSignUp(): Promise<void> {
    await expect(this.registrationSection).toBeVisible();
    await expect(this.registrationSection.getByRole('button')).toHaveCount(0);
    await expect(this.registrationSection.getByRole('link')).toHaveCount(0);
    await expect(this.root.getByRole('button', { name: SIGN_UP_CONTROL_PATTERN })).toHaveCount(0);
    await expect(this.root.getByRole('link', { name: SIGN_UP_CONTROL_PATTERN })).toHaveCount(0);
  }

  /** One group per discipline and gender, in order, each with its row count. */
  async expectDivisionGroups(groups: readonly { label: string; rows: number }[]): Promise<void> {
    const headings = this.page.getByTestId(IDS.divisionGroup).getByRole('heading');
    await expect(headings).toHaveText(groups.map(group => group.label));
    for (const { label, rows } of groups) {
      const group = this.page
        .getByTestId(IDS.divisionGroup)
        .filter({ has: this.page.getByRole('heading', { name: label, exact: true }) });
      await expect(group.getByTestId(IDS.divisionRow)).toHaveCount(rows);
    }
  }
}
