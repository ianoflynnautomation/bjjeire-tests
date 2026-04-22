import { expect, type Page } from '@playwright/test';
import { gotoURL } from '@ui/support/ui';

export type AboutScreen = Readonly<{
  navigate: () => Promise<void>;
  verifyIsLoaded: () => Promise<void>;
  verifyOurMissionSection: () => Promise<void>;
  verifyValuesSection: () => Promise<void>;
  verifyContactSection: () => Promise<void>;
}>;

export function getAboutLocators(page: Page) {
  return {
    main: page.getByRole('main'),
    missionHeading: page.getByRole('heading', { name: 'Our Mission', level: 2 }),
    missionParagraph1: page.getByTestId('about-paragraph-text-1'),
    missionParagraph2: page.getByTestId('about-paragraph-text-2'),
    valuesList: page.getByTestId('about-values-list'),
    valuesHeading: page.getByRole('heading', { name: 'Open Source Philosophy', level: 2 }),
    contactHeading: page.getByRole('heading', { name: 'Get Involved', level: 2 }),
    contactParagraph: page.getByTestId('about-paragraph-text'),
    emailLink: page.getByRole('link', { name: '/send an email/i' }),
  };
}

export function createAboutScreen(page: Page): AboutScreen {
  const locators = getAboutLocators(page);

  return {
    async navigate() {
      await gotoURL(page, '/about');
    },
    async verifyIsLoaded() {
      await expect(page).toHaveURL(/\/about$/);
      await expect(locators.main).toBeVisible();
    },
    async verifyOurMissionSection() {
      await expect(locators.missionHeading).toBeVisible();
      await expect(locators.missionParagraph1).toHaveText(
        'BJJ Éire exists to make Irish Jiu-Jitsu more accessible. Whether you are looking for a gym to train at, a tournament to compete in, or an open mat to visit, this is the place to find it — accurate, up to date, and free.',
      );
      await expect(locators.missionParagraph2).toHaveText(
        'The goal is simple: help the Irish BJJ community train more, compete more, and connect more. Every listing, filter, and fix moves that mission forward.',
      );
    },
    async verifyValuesSection() {
      const expectedValuesRowsText = [
        'BJJ Éire is fully open source — the code, the data model, and the roadmap are all public.',
        'Anyone can contribute: add a gym, report a correction, suggest a feature, or submit a pull request.',
        'No ads, no paywalls, no trackers — built by the community, for the community.',
        'The project grows through participation. If you train BJJ in Ireland, this is your directory too.',
      ];

      await expect(locators.valuesHeading).toBeVisible();
      for (const text of expectedValuesRowsText) {
        await expect(locators.valuesList.locator('li').filter({ hasText: text })).toBeVisible();
      }
    },
    async verifyContactSection() {
      await expect(locators.contactHeading).toBeVisible();
      await expect(locators.contactParagraph).toHaveText(
        'Have a gym to add, a correction to report, or want to contribute? Email info@bjj-eire.com.',
      );
      //await expect(locators.emailLink).toBeVisible();
    },
  };
}
