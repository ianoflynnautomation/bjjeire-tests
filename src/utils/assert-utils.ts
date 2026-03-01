import { type Expect, type Locator, type Page, type TestInfo, expect } from '@playwright/test';
import { type ExpectOptions, type ExpectTextOptions, type SoftOption } from '../types/playwright-types';
import { getLocator } from './locator-utils';

function getExpectWithSoftOption(options?: SoftOption): Expect {
  return expect.configure({ soft: options?.soft });
}

function getLocatorAndAssert(
  page: Page,
  input: string | Locator,
  options?: SoftOption,
): { locator: Locator; assert: Expect } {
  return { locator: getLocator(page, input), assert: getExpectWithSoftOption(options) };
}

/** Fails the test if any soft assertions have accumulated errors. */
export function assertAllSoftAssertions(testInfo: TestInfo): void {
  expect(testInfo.errors).toHaveLength(0);
}

export async function expectElementToBeHidden(
  page: Page,
  input: string | Locator,
  options?: ExpectOptions,
): Promise<void> {
  const { locator, assert } = getLocatorAndAssert(page, input, options);
  await assert(locator, options).toBeHidden(options);
}

export async function expectElementToBeVisible(
  page: Page,
  input: string | Locator,
  options?: ExpectOptions,
): Promise<void> {
  const { locator, assert } = getLocatorAndAssert(page, input, options);
  await assert(locator, options).toBeVisible(options);
}

export async function expectElementToBeAttached(
  page: Page,
  input: string | Locator,
  options?: ExpectOptions,
): Promise<void> {
  const { locator, assert } = getLocatorAndAssert(page, input, options);
  await assert(locator, options).toBeAttached(options);
}

export async function expectElementToBeInViewport(
  page: Page,
  input: string | Locator,
  options?: ExpectOptions,
): Promise<void> {
  const { locator, assert } = getLocatorAndAssert(page, input, options);
  await assert(locator, options).toBeInViewport(options);
}

export async function expectElementToBeChecked(
  page: Page,
  input: string | Locator,
  options?: ExpectOptions,
): Promise<void> {
  const { locator, assert } = getLocatorAndAssert(page, input, options);
  await assert(locator, options).toBeChecked(options);
}

export async function expectElementNotToBeChecked(
  page: Page,
  input: string | Locator,
  options?: ExpectOptions,
): Promise<void> {
  const { locator, assert } = getLocatorAndAssert(page, input, options);
  await assert(locator, options).not.toBeChecked(options);
}

export async function expectElementToBeDisabled(
  page: Page,
  input: string | Locator,
  options?: ExpectOptions,
): Promise<void> {
  const { locator, assert } = getLocatorAndAssert(page, input, options);
  await assert(locator, options).toBeDisabled(options);
}

export async function expectElementToBeEnabled(
  page: Page,
  input: string | Locator,
  options?: ExpectOptions,
): Promise<void> {
  const { locator, assert } = getLocatorAndAssert(page, input, options);
  await assert(locator, options).toBeEnabled(options);
}

export async function expectElementToBeEditable(
  page: Page,
  input: string | Locator,
  options?: ExpectOptions,
): Promise<void> {
  const { locator, assert } = getLocatorAndAssert(page, input, options);
  await assert(locator, options).toBeEditable(options);
}

export async function expectElementToHaveText(
  page: Page,
  input: string | Locator,
  text: string | RegExp | Array<string | RegExp>,
  options?: ExpectOptions & ExpectTextOptions,
): Promise<void> {
  const { locator, assert } = getLocatorAndAssert(page, input, options);
  await assert(locator, options).toHaveText(text, options);
}

export async function expectElementNotToHaveText(
  page: Page,
  input: string | Locator,
  text: string | RegExp | Array<string | RegExp>,
  options?: ExpectOptions & ExpectTextOptions,
): Promise<void> {
  const { locator, assert } = getLocatorAndAssert(page, input, options);
  await assert(locator, options).not.toHaveText(text, options);
}

export async function expectElementToContainText(
  page: Page,
  input: string | Locator,
  text: string | RegExp | Array<string | RegExp>,
  options?: ExpectOptions & ExpectTextOptions,
): Promise<void> {
  const { locator, assert } = getLocatorAndAssert(page, input, options);
  await assert(locator, options).toContainText(text, options);
}

export async function expectElementNotToContainText(
  page: Page,
  input: string | Locator,
  text: string | RegExp | Array<string | RegExp>,
  options?: ExpectOptions & ExpectTextOptions,
): Promise<void> {
  const { locator, assert } = getLocatorAndAssert(page, input, options);
  await assert(locator, options).not.toContainText(text, options);
}

export async function expectElementToHaveValue(
  page: Page,
  input: string | Locator,
  text: string | RegExp,
  options?: ExpectOptions,
): Promise<void> {
  const { locator, assert } = getLocatorAndAssert(page, input, options);
  await assert(locator, options).toHaveValue(text, options);
}

export async function expectElementToHaveValues(
  page: Page,
  input: string | Locator,
  text: Array<string | RegExp>,
  options?: ExpectOptions,
): Promise<void> {
  const { locator, assert } = getLocatorAndAssert(page, input, options);
  await assert(locator, options).toHaveValues(text, options);
}

export async function expectElementValueToBeEmpty(
  page: Page,
  input: string | Locator,
  options?: ExpectOptions,
): Promise<void> {
  const { locator, assert } = getLocatorAndAssert(page, input, options);
  await assert(locator, options).toBeEmpty(options);
}

export async function expectElementValueNotToBeEmpty(
  page: Page,
  input: string | Locator,
  options?: ExpectOptions,
): Promise<void> {
  const { locator, assert } = getLocatorAndAssert(page, input, options);
  await assert(locator, options).not.toBeEmpty(options);
}

export async function expectElementToHaveAttribute(
  page: Page,
  input: string | Locator,
  attribute: string,
  value: string | RegExp,
  options?: ExpectOptions,
): Promise<void> {
  const { locator, assert } = getLocatorAndAssert(page, input, options);
  await assert(locator, options).toHaveAttribute(attribute, value, options);
}

export async function expectElementToContainAttribute(
  page: Page,
  input: string | Locator,
  attribute: string,
  value: string | RegExp,
  options?: ExpectOptions,
): Promise<void> {
  const { locator, assert } = getLocatorAndAssert(page, input, options);
  await assert(locator, options).toHaveAttribute(attribute, new RegExp(value), options);
}

export async function expectElementToHaveCount(
  page: Page,
  input: string | Locator,
  count: number,
  options?: ExpectOptions,
): Promise<void> {
  const { locator, assert } = getLocatorAndAssert(page, input, options);
  await assert(locator, options).toHaveCount(count, options);
}

export async function expectPageToHaveURL(
  page: Page,
  urlOrRegExp: string | RegExp,
  options?: ExpectOptions,
): Promise<void> {
  const assert = getExpectWithSoftOption(options);
  await assert(page).toHaveURL(urlOrRegExp, options);
}

export async function expectPageToContainURL(page: Page, url: string, options?: ExpectOptions): Promise<void> {
  const assert = getExpectWithSoftOption(options);
  await assert(page).toHaveURL(new RegExp(url), options);
}

export async function expectPageToHaveTitle(
  page: Page,
  titleOrRegExp: string | RegExp,
  options?: ExpectOptions,
): Promise<void> {
  const assert = getExpectWithSoftOption(options);
  await assert(page).toHaveTitle(titleOrRegExp, options);
}
