import { expect, type Locator, type Page } from '@playwright/test';
import {
  COMPETITOR_PROFILE_COPY as COPY,
  OWN_COMPETITOR_API_ROUTE,
  COMPETITOR_PROFILE_TEST_IDS as IDS,
} from './tournaments.constants';
import type { ProfileDetails } from './tournaments.types';

/** The competitor's own profile (`/account/profile`), reached through the header's account link. */
export class CompetitorProfilePage {
  constructor(private readonly page: Page) {}

  private get root(): Locator {
    return this.page.getByTestId(IDS.root);
  }

  private field(label: string): Locator {
    return this.root.getByLabel(label, { exact: true });
  }

  async openFromAccountLink(): Promise<void> {
    await this.page.getByTestId(IDS.accountLink).click();
  }

  /** The empty "Create your competitor profile" form is on screen: the page is loaded, not still checking the sign-in. */
  async expectCreateFormShown(options: { timeout?: number } = {}): Promise<void> {
    const timeout = options.timeout === undefined ? {} : { timeout: options.timeout };
    await expect(this.root.getByRole('heading', { name: COPY.createHeading })).toBeVisible(timeout);
    await expect(this.root.getByTestId(IDS.form)).toBeVisible(timeout);
  }

  /** Nothing from an earlier profile is filled in. */
  async expectEmptyForm(): Promise<void> {
    await expect(this.field(COPY.firstName)).toHaveValue('');
    await expect(this.field(COPY.lastName)).toHaveValue('');
    await expect(this.field(COPY.dateOfBirth)).toHaveValue('');
    await expect(this.field(COPY.affiliation)).toHaveValue('');
  }

  /** Signed out: no profile page content (and so no profile) is on screen. */
  async expectNoProfileShown(): Promise<void> {
    await expect(this.root).toHaveCount(0);
  }

  /** The saved profile is on screen ("My competitor profile"), not the create form. */
  async expectSavedProfileShown(): Promise<void> {
    await expect(this.root.getByRole('heading', { name: COPY.savedHeading })).toBeVisible();
  }

  async fillDetails(details: ProfileDetails): Promise<void> {
    await this.field(COPY.firstName).fill(details.firstName);
    await this.field(COPY.lastName).fill(details.lastName);
    await this.field(COPY.nationality).selectOption({ label: details.nationality });
    await this.field(COPY.dateOfBirth).fill(details.dateOfBirth);
    await this.field(COPY.gender).selectOption({ label: details.gender });
    await this.field(COPY.belt).selectOption({ label: details.belt });
  }

  async chooseAcademyDirectory(): Promise<void> {
    await this.root.getByLabel(COPY.academyDirectory).check();
  }

  /** Searches the directory by part of a name and picks the result with exactly this name. */
  async searchAndPickGym(searchTerm: string, gymName: string): Promise<void> {
    await this.field(COPY.academySearch).fill(searchTerm);
    await this.root.getByTestId(IDS.academyOption).getByText(gymName, { exact: true }).click();
  }

  async typeAcademy(name: string): Promise<void> {
    await this.root.getByLabel(COPY.academyTyped).check();
    await this.field(COPY.academyName).fill(name);
  }

  async chooseNoAcademy(): Promise<void> {
    await this.root.getByLabel(COPY.academyNone).check();
  }

  /** Saves and waits for the app to say so, so what is read next is the saved profile. */
  async save(): Promise<void> {
    await this.root.getByTestId(IDS.submit).click();
    await expect(this.root.getByTestId(IDS.formNotice)).toHaveText(COPY.saved);
  }

  async expectDetails(details: ProfileDetails): Promise<void> {
    await expect(this.field(COPY.firstName)).toHaveValue(details.firstName);
    await expect(this.field(COPY.lastName)).toHaveValue(details.lastName);
    await expect(this.field(COPY.nationality).locator('option:checked')).toHaveText(details.nationality);
    await expect(this.field(COPY.dateOfBirth)).toHaveValue(details.dateOfBirth);
    await expect(this.field(COPY.gender).locator('option:checked')).toHaveText(details.gender);
    await expect(this.field(COPY.belt).locator('option:checked')).toHaveText(details.belt);
  }

  async expectEmail(email: string): Promise<void> {
    await expect(this.root.getByTestId(IDS.email)).toHaveText(`${COPY.emailLabel} ${email}`);
  }

  async expectDirectoryAcademy(gymName: string): Promise<void> {
    await expect(this.root.getByLabel(COPY.academyDirectory)).toBeChecked();
    await expect(this.root.getByTestId(IDS.academySelected)).toHaveText(`${COPY.academySelected}: ${gymName}`);
  }

  async expectTypedAcademy(name: string): Promise<void> {
    await expect(this.root.getByLabel(COPY.academyTyped)).toBeChecked();
    await expect(this.field(COPY.academyName)).toHaveValue(name);
  }

  async expectNoAcademy(): Promise<void> {
    await expect(this.root.getByLabel(COPY.academyNone)).toBeChecked();
  }

  async expectNoAffiliation(): Promise<void> {
    await expect(this.field(COPY.affiliation)).toHaveValue('');
  }

  async expectMedals(counts: Readonly<{ gold: number; silver: number; bronze: number }>): Promise<void> {
    await expect(this.root.getByTestId(IDS.historyGold)).toHaveText(String(counts.gold));
    await expect(this.root.getByTestId(IDS.historySilver)).toHaveText(String(counts.silver));
    await expect(this.root.getByTestId(IDS.historyBronze)).toHaveText(String(counts.bronze));
  }

  async expectNoTournamentsEntered(): Promise<void> {
    await expect(this.root.getByTestId(IDS.historyEmpty)).toHaveText(COPY.historyEmpty);
    await expect(this.root.getByTestId(IDS.historyRow)).toHaveCount(0);
  }

  async signOut(): Promise<void> {
    await this.root.getByTestId(IDS.signOut).click();
  }

  /** Deletes the account and waits for the API to confirm it. */
  async deleteAccount(): Promise<void> {
    await this.root.getByTestId(IDS.delete).click();
    const deleted = this.page.waitForResponse(
      response => response.request().method() === 'DELETE' && OWN_COMPETITOR_API_ROUTE.test(response.url()),
    );
    await this.root.getByTestId(IDS.deleteConfirm).click();
    const response = await deleted;
    expect(response.ok(), `${response.url()} status ${response.status()}`).toBe(true);
  }
}
