import { expect, type Locator, type Page } from '@playwright/test';
import { escapeRegExp, gotoAppShell, gotoRoute } from '@ui/support';
import {
  BJJEIRE_COMPETITION_COPY,
  BJJEIRE_COMPETITION_TEST_IDS as IDS,
  DEFAULT_PAGE_HEADER_TEST_ID,
  OWN_SIGN_UPS_API_ROUTE,
  REGISTRATION_WINDOW_PATTERN,
  bjjEireCompetitionPath,
  bjjEireCompetitionSignUpPath,
} from './competitions.constants';

/** One BJJ Éire competition's public page, at `/competitions/{slug}`. */
export class BjjEireCompetitionPage {
  constructor(private readonly page: Page) {}

  private get main(): Locator {
    return this.page.getByRole('main');
  }

  private get notFoundHeading(): Locator {
    return this.main.getByRole('heading', { level: 1, name: BJJEIRE_COMPETITION_COPY.notFoundTitle, exact: true });
  }

  /** A direct load of a competition's page: the page's own root is the route anchor, because the title shows the site default first. */
  async goTo(slug: string): Promise<void> {
    await gotoRoute(this.page, bjjEireCompetitionPath(slug), this.page.getByTestId(IDS.root));
  }

  /** A direct load of an address no competition has: there is no competition page to wait for. */
  async goToUnknownAddress(slug: string): Promise<void> {
    await gotoRoute(this.page, bjjEireCompetitionPath(slug), this.notFoundHeading);
  }

  /** A direct load of an address the app no longer serves; only the shell is waited for. */
  async goToRetiredAddress(address: string): Promise<void> {
    await gotoAppShell(this.page, address);
  }

  async expectNotFound(): Promise<void> {
    await expect(this.notFoundHeading).toBeVisible();
  }

  async expectBackLinkToList(): Promise<void> {
    const link = this.main.getByRole('link', { name: BJJEIRE_COMPETITION_COPY.notFoundBackLink, exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/competitions');
  }

  async expectAddress(slug: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`${bjjEireCompetitionPath(slug)}$`));
  }

  /** A retired address is an unknown address: the app's default page (Events) is what shows. */
  async expectDefaultPageShown(): Promise<void> {
    await expect(this.page).toHaveURL(/\/events$/);
    await expect(this.page.getByTestId(DEFAULT_PAGE_HEADER_TEST_ID)).toBeVisible();
  }

  async expectDetails(expected: { name: string; date: string; venue: string; fee: string }): Promise<void> {
    await expect(this.page.getByTestId(IDS.name)).toHaveText(expected.name);
    await expect(this.page.getByTestId(IDS.date)).toHaveText(expected.date);
    await expect(this.page.getByTestId(IDS.venue)).toContainText(expected.venue);
    await expect(this.page.getByTestId(IDS.fee)).toHaveText(`${expected.fee} ${BJJEIRE_COMPETITION_COPY.feeNote}`);
  }

  async expectRegistrationWindowInIrishTime(): Promise<void> {
    await expect(this.page.getByTestId(IDS.window)).toHaveText(REGISTRATION_WINDOW_PATTERN);
  }

  async expectName(name: string): Promise<void> {
    await expect(this.page.getByTestId(IDS.name)).toHaveText(name);
  }

  /** The window as the page words it: `<opens> to <closes> (Irish time)`, for instants the caller renders. */
  async expectRegistrationWindow(opens: string, closes: string): Promise<void> {
    const { windowSeparator, timeZoneNote } = BJJEIRE_COMPETITION_COPY;
    await expect(this.page.getByTestId(IDS.window)).toHaveText(
      `${opens} ${windowSeparator} ${closes} (${timeZoneNote})`,
    );
  }

  /** Just the two times, in the page's own wording, without the label. */
  async expectWindowTimes(opens: string, closes: string): Promise<void> {
    await expect(this.page.getByTestId(IDS.window)).toContainText(
      `${opens} ${BJJEIRE_COMPETITION_COPY.windowSeparator} ${closes}`,
    );
  }

  async expectWindowLabelledIrishTime(): Promise<void> {
    await expect(this.page.getByTestId(IDS.window)).toContainText(`(${BJJEIRE_COMPETITION_COPY.timeZoneNote})`);
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

  async expectDivisions(count: number): Promise<void> {
    await expect(this.page.getByTestId(IDS.divisionRow)).toHaveCount(count);
  }

  async expectRegistrationStatus(badge: string): Promise<void> {
    await expect(this.page.getByTestId(IDS.registrationStatus).getByText(badge, { exact: true })).toBeVisible();
  }

  /** The whole sentence on registration: fixed copy, or a date the caller renders from the API's instants. */
  async expectRegistrationMessage(sentence: string): Promise<void> {
    await expect(this.page.getByTestId(IDS.registrationMessage)).toHaveText(sentence);
  }

  async expectNoSignUpLink(): Promise<void> {
    await expect(this.page.getByTestId(IDS.signUpLink)).toHaveCount(0);
  }

  /** The one sign-up control the app renders, in the registration section. */
  private get signUpLink(): Locator {
    return this.page.getByTestId(IDS.registrationStatus).getByTestId(IDS.signUpLink);
  }

  /** The sign-up is offered: a visible, enabled "Sign up" link. It is never followed by this check. */
  async expectSignUpOffered(): Promise<void> {
    await expect(this.signUpLink).toBeVisible();
    await expect(this.signUpLink).toBeEnabled();
    await expect(this.signUpLink).toHaveText(BJJEIRE_COMPETITION_COPY.signUp);
  }

  async expectSignUpLeadsToCompetition(slug: string): Promise<void> {
    await expect(this.signUpLink).toHaveAttribute('href', bjjEireCompetitionSignUpPath(slug));
  }

  /** Chooses "Sign up". Only navigates: the sign-up itself is made on the next page, which no test submits. */
  async chooseSignUp(): Promise<void> {
    await this.signUpLink.click();
  }

  /** Chooses "My sign-ups" beside the sign-up link: the visitor's route to their own list (the nav icon leads to the profile). */
  async chooseMySignUps(): Promise<void> {
    // Wait for the list to load (200), so what the page shows next is the competitor's real list, not the
    // state before it arrives or after a failed fetch.
    const loaded = this.page.waitForResponse(
      response => response.request().method() === 'GET' && OWN_SIGN_UPS_API_ROUTE.test(response.url()),
    );
    await this.page.getByTestId(IDS.registrationStatus).getByTestId(IDS.mySignUpsLink).click();
    const response = await loaded;
    expect(response.status(), `${response.url()} must load the competitor's sign-ups`).toBe(200);
  }

  /** One division's podium on the Results section, found by its heading. */
  private podium(division: string): Locator {
    return this.page
      .getByTestId(IDS.leaderboard)
      .getByTestId(IDS.leaderboardPodium)
      .filter({ has: this.page.getByRole('heading', { level: 4, name: division, exact: true }) });
  }

  /** The Results section shows a recorded podium for the division, with its gold medallist. */
  async expectResultsPodiumGold(division: string, gold: string): Promise<void> {
    await expect(this.podium(division).getByTestId(IDS.leaderboardGold)).toContainText(gold);
  }

  /** The "No results yet" message is absent from the Results section. */
  async expectNoEmptyResultsMessage(): Promise<void> {
    await expect(this.page.getByTestId(IDS.leaderboard).getByTestId(IDS.leaderboardEmpty)).toHaveCount(0);
  }

  /** The division's podium carries the note that it adds no team points (fewer than two competitors). */
  async expectPodiumNote(division: string, note: string): Promise<void> {
    const noPoints = this.podium(division).getByTestId(IDS.leaderboardNoPoints);
    await expect(noPoints).toHaveText(note);
  }

  /** One division's block in the Competitors section, found by its level 3 heading. */
  private competitorDivision(heading: string): Locator {
    return this.page
      .getByTestId(IDS.competitors)
      .getByTestId(IDS.competitorsDivision)
      .filter({ has: this.page.getByRole('heading', { level: 3, name: heading, exact: true }) });
  }

  /** Exactly these competitors, in the listed order, each with its academy line (`academy · affiliation`, or "No academy"). */
  async expectCompetitors(heading: string, competitors: readonly { name: string; team: string }[]): Promise<void> {
    const rows = this.competitorDivision(heading).getByTestId(IDS.competitorsRow);
    await expect(rows).toHaveCount(competitors.length);
    for (const [index, competitor] of competitors.entries()) {
      await expect(rows.nth(index)).toHaveText(
        new RegExp(`^${escapeRegExp(competitor.name)}\\s*${escapeRegExp(competitor.team)}$`),
      );
    }
  }
}
