import { expect, type Expect, type Locator, type Page, type TestInfo } from '@playwright/test';
import type { ExpectOptions, ExpectTextOptions, SoftOption } from '@lib/types';

function toLocator(page: Page, input: string | Locator): Locator {
  return typeof input === 'string' ? page.locator(input) : input;
}

function configured(options?: SoftOption): Expect {
  return expect.configure({ soft: options?.soft });
}

export function assertAllSoftAssertions(testInfo: TestInfo): void {
  expect(testInfo.errors).toHaveLength(0);
}

export async function expectVisible(page: Page, input: string | Locator, options?: ExpectOptions): Promise<void> {
  await configured(options)(toLocator(page, input), options).toBeVisible(options);
}

export async function expectHidden(page: Page, input: string | Locator, options?: ExpectOptions): Promise<void> {
  await configured(options)(toLocator(page, input), options).toBeHidden(options);
}

export async function expectAttached(page: Page, input: string | Locator, options?: ExpectOptions): Promise<void> {
  await configured(options)(toLocator(page, input), options).toBeAttached(options);
}

export async function expectText(
  page: Page,
  input: string | Locator,
  text: string | RegExp | Array<string | RegExp>,
  options?: ExpectOptions & ExpectTextOptions,
): Promise<void> {
  await configured(options)(toLocator(page, input), options).toHaveText(text, options);
}

export async function expectContainsText(
  page: Page,
  input: string | Locator,
  text: string | RegExp | Array<string | RegExp>,
  options?: ExpectOptions & ExpectTextOptions,
): Promise<void> {
  await configured(options)(toLocator(page, input), options).toContainText(text, options);
}

export async function expectValue(
  page: Page,
  input: string | Locator,
  value: string | RegExp,
  options?: ExpectOptions,
): Promise<void> {
  await configured(options)(toLocator(page, input), options).toHaveValue(value, options);
}

export async function expectCount(
  page: Page,
  input: string | Locator,
  count: number,
  options?: ExpectOptions,
): Promise<void> {
  await configured(options)(toLocator(page, input), options).toHaveCount(count, options);
}

export async function expectURL(page: Page, urlOrRegExp: string | RegExp, options?: ExpectOptions): Promise<void> {
  await configured(options)(page).toHaveURL(urlOrRegExp, options);
}

export async function expectTitle(page: Page, titleOrRegExp: string | RegExp, options?: ExpectOptions): Promise<void> {
  await configured(options)(page).toHaveTitle(titleOrRegExp, options);
}
