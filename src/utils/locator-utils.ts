import { type FrameLocator, type Locator, type Page } from '@playwright/test';
import {
  type GetByPlaceholderOptions,
  type GetByRoleOptions,
  type GetByRoleTypes,
  type GetByTextOptions,
  type LocatorOptions,
} from '../types/playwright-types';

export function getLocator(page: Page, input: string | Locator, options?: LocatorOptions): Locator {
  return typeof input === 'string' ? page.locator(input, options) : input;
}

export function getLocatorByTestId(page: Page, testId: string | RegExp): Locator {
  return page.getByTestId(testId);
}

export function getLocatorByText(page: Page, text: string | RegExp, options?: GetByTextOptions): Locator {
  return page.getByText(text, options);
}

export function getLocatorByRole(page: Page, role: GetByRoleTypes, options?: GetByRoleOptions): Locator {
  return page.getByRole(role, options);
}

export function getLocatorByLabel(page: Page, text: string | RegExp, options?: GetByRoleOptions): Locator {
  return page.getByLabel(text, options);
}

export function getLocatorByPlaceholder(page: Page, text: string | RegExp, options?: GetByPlaceholderOptions): Locator {
  return page.getByPlaceholder(text, options);
}

export async function getAllLocators(
  page: Page,
  input: string | Locator,
  options?: LocatorOptions,
): Promise<Locator[]> {
  return typeof input === 'string' ? await page.locator(input, options).all() : await input.all();
}

export function getFrameLocator(page: Page, frameInput: string | FrameLocator): FrameLocator {
  return typeof frameInput === 'string' ? page.frameLocator(frameInput) : frameInput;
}

export function getLocatorInFrame(page: Page, frameInput: string | FrameLocator, input: string | Locator): Locator {
  return getFrameLocator(page, frameInput).locator(input);
}
