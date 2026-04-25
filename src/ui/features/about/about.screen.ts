import { expect, type Locator, type Page } from '@playwright/test';
import { gotoURL, stabilizeForSnapshot, type SnapshotMaskOption } from '@ui/support/ui';

export type AboutScreenshotRegion = 'page' | 'mission' | 'values' | 'contact' | 'headerTitle';
export type AboutAriaRegion = Exclude<AboutScreenshotRegion, 'page'>;

export type AboutScreen = Readonly<{
  navigate: () => Promise<void>;
  verifyIsLoaded: () => Promise<void>;
  stabilize: () => Promise<void>;
  expectScreenshot: (name: string, options?: SnapshotMaskOption & { region?: AboutScreenshotRegion }) => Promise<void>;
  expectAriaTree: (region: AboutAriaRegion, name: string) => Promise<void>;
}>;

function getAboutLocators(page: Page) {
  return {
    main: page.getByRole('main'),
    headerTitle: page.getByTestId('about-page-header-title'),
    mission: page.getByTestId('about-mission-section'),
    values: page.getByTestId('about-values-section'),
    contact: page.getByTestId('about-contact-section'),
  };
}

export function createAboutScreen(page: Page): AboutScreen {
  const locators = getAboutLocators(page);

  const ariaRegions: Record<AboutAriaRegion, Locator> = {
    mission: locators.mission,
    values: locators.values,
    contact: locators.contact,
    headerTitle: locators.headerTitle,
  };

  const screenshotRegions: Record<AboutScreenshotRegion, Page | Locator> = {
    page,
    ...ariaRegions,
  };

  return {
    async navigate() {
      await gotoURL(page, '/about');
    },
    async verifyIsLoaded() {
      await expect(page).toHaveURL(/\/about$/);
      await expect(locators.main).toBeVisible();
    },
    stabilize: () => stabilizeForSnapshot(page),
    async expectScreenshot(name, options = {}) {
      await stabilizeForSnapshot(page);
      const target = screenshotRegions[options.region ?? 'page'];
      await expect(target).toHaveScreenshot(name, options.mask ? { mask: [...options.mask] } : undefined);
    },
    async expectAriaTree(region, name) {
      await expect(ariaRegions[region]).toMatchAriaSnapshot({ name });
    },
  };
}
