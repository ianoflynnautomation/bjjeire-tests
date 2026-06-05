import { type Locator, type Page, expect } from '@playwright/test';
import { type ExpectOptions } from './types/optional-parameter-types';

export async function expectVisible(locator: Locator, options?: ExpectOptions): Promise<void> {
  await expect(locator).toBeVisible(options);
}

export async function expectHidden(locator: Locator, options?: ExpectOptions): Promise<void> {
  await expect(locator).toBeHidden(options);
}

export async function expectEnabled(locator: Locator, options?: ExpectOptions): Promise<void> {
  await expect(locator).toBeEnabled(options);
}

export async function expectDisabled(locator: Locator, options?: ExpectOptions): Promise<void> {
  await expect(locator).toBeDisabled(options);
}

export async function expectChecked(locator: Locator, options?: ExpectOptions): Promise<void> {
  await expect(locator).toBeChecked(options);
}

export async function expectToHaveText(
  locator: Locator,
  text: string | RegExp,
  options?: ExpectOptions,
): Promise<void> {
  await expect(locator).toHaveText(text, options);
}

export async function expectToContainText(
  locator: Locator,
  text: string | RegExp,
  options?: ExpectOptions,
): Promise<void> {
  await expect(locator).toContainText(text, options);
}

export async function expectToHaveAttribute(
  locator: Locator,
  attribute: string,
  value: string | RegExp,
  options?: ExpectOptions,
): Promise<void> {
  await expect(locator).toHaveAttribute(attribute, value, options);
}

export async function expectToHaveValue(
  locator: Locator,
  value: string | RegExp,
  options?: ExpectOptions,
): Promise<void> {
  await expect(locator).toHaveValue(value, options);
}

export async function expectToHaveCount(locator: Locator, count: number, options?: ExpectOptions): Promise<void> {
  await expect(locator).toHaveCount(count, options);
}

export async function expectToHaveClass(
  locator: Locator,
  className: string | RegExp,
  options?: ExpectOptions,
): Promise<void> {
  await expect(locator).toHaveClass(className, options);
}

export async function expectPageToHaveTitle(
  page: Page,
  title: string | RegExp,
  options?: ExpectOptions,
): Promise<void> {
  await expect(page).toHaveTitle(title, options);
}

export async function expectNotVisible(locator: Locator, options?: ExpectOptions): Promise<void> {
  await expect(locator).not.toBeVisible(options);
}

export async function expectNotToHaveText(
  locator: Locator,
  text: string | RegExp,
  options?: ExpectOptions,
): Promise<void> {
  await expect(locator).not.toHaveText(text, options);
}
