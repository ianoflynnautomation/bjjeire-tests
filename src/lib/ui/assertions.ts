import { expect, type Expect, type Locator, type Page, type TestInfo } from '@playwright/test';

export type ScreenAssertions = Readonly<{
  page: Page;
  expectToHaveTitle: (text: RegExp | string) => Promise<void>;
  expectToHaveURL: (url: RegExp | string) => Promise<void>;
  expectToHaveText: (locator: Locator, text: string | string[]) => Promise<void>;
  expectToContainText: (locator: Locator, text: string) => Promise<void>;
  expectElementVisible: (locator: Locator) => Promise<void>;
  expectElementHidden: (locator: Locator) => Promise<void>;
  expectElementEnabled: (locator: Locator) => Promise<void>;
  expectElementDisabled: (locator: Locator) => Promise<void>;
  expectElementChecked: (locator: Locator) => Promise<void>;
  expectToHaveValue: (locator: Locator, value: RegExp | string) => Promise<void>;
  expectToHaveCount: (locator: Locator, count: number) => Promise<void>;
}>;

export const softExpect: Expect = expect.configure({ soft: true });

export function assertAllSoftAssertions(testInfo: TestInfo): void {
  expect(testInfo.errors).toHaveLength(0);
}

export function createScreenAssertions(page: Page): ScreenAssertions {
  return {
    page,

    async expectToHaveTitle(text: RegExp | string) {
      await expect(page).toHaveTitle(text);
    },

    async expectToHaveURL(url: RegExp | string) {
      await expect(page).toHaveURL(url);
    },

    async expectToHaveText(locator: Locator, text: string | string[]) {
      await expect(locator).toHaveText(text);
    },

    async expectToContainText(locator: Locator, text: string) {
      await expect(locator).toContainText(text);
    },

    async expectElementVisible(locator: Locator) {
      await expect(locator).toBeVisible();
    },

    async expectElementHidden(locator: Locator) {
      await expect(locator).toBeHidden();
    },

    async expectElementEnabled(locator: Locator) {
      await expect(locator).toBeEnabled();
    },

    async expectElementDisabled(locator: Locator) {
      await expect(locator).toBeDisabled();
    },

    async expectElementChecked(locator: Locator) {
      await expect(locator).toBeChecked();
    },

    async expectToHaveValue(locator: Locator, value: RegExp | string) {
      await expect(locator).toHaveValue(value);
    },

    async expectToHaveCount(locator: Locator, count: number) {
      await expect(locator).toHaveCount(count);
    },
  };
}
