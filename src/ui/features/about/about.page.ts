import { expect, type Locator, type Page } from '@playwright/test';
import {
  getLocatorByRole,
  getLocatorByTestId,
  getPage,
  gotoURL,
  stabilizeForSnapshot,
  type SnapshotMaskOption,
} from '@ui/support/ui';

export type AboutScreenshotRegion = 'page' | 'mission' | 'values' | 'contact' | 'headerTitle';
export type AboutAriaRegion = Exclude<AboutScreenshotRegion, 'page'>;

const main = () => getLocatorByRole('main');
const headerTitle = () => getLocatorByTestId('about-page-header-title');
const mission = () => getLocatorByTestId('about-mission-section');
const values = () => getLocatorByTestId('about-values-section');
const contact = () => getLocatorByTestId('about-contact-section');

function ariaRegion(region: AboutAriaRegion): Locator {
  const regions: Record<AboutAriaRegion, Locator> = {
    contact: contact(),
    headerTitle: headerTitle(),
    mission: mission(),
    values: values(),
  };

  return regions[region];
}

function screenshotRegion(region: AboutScreenshotRegion): Page | Locator {
  if (region === 'page') return getPage();
  return ariaRegion(region);
}

export async function navigate(): Promise<void> {
  await gotoURL(getPage(), '/about');
}

export async function verifyIsLoaded(): Promise<void> {
  await expect(getPage()).toHaveURL(/\/about$/);
  await expect(main()).toBeVisible();
  await expect(headerTitle()).toBeVisible();
  await expect(mission()).toBeVisible();
  await expect(values()).toBeVisible();
  await expect(contact()).toBeVisible();
}

export async function stabilize(): Promise<void> {
  await stabilizeForSnapshot(getPage());
}

export async function expectScreenshot(
  name: string,
  options: SnapshotMaskOption & { region?: AboutScreenshotRegion } = {},
): Promise<void> {
  await stabilizeForSnapshot(getPage());
  const target = screenshotRegion(options.region ?? 'page');
  await expect(target).toHaveScreenshot(name, options.mask ? { mask: [...options.mask] } : undefined);
}

export async function expectAriaTree(region: AboutAriaRegion, name: string): Promise<void> {
  await expect(ariaRegion(region)).toMatchAriaSnapshot({ name });
}
