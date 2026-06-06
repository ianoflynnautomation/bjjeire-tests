import { type Expect, expect, type Page, type Response } from '@playwright/test';
import { type ExpectOptions, type GotoOptions, type SoftOption } from './types/optional-parameter-types';

export async function goToPage(
  page: Page,
  path: string,
  options: GotoOptions = { waitUntil: 'load' },
): Promise<Response | null> {
  return page.goto(path, options);
}

function getExpectWithSoftOption(options?: SoftOption): Expect {
  return expect.configure(options?.soft === undefined ? {} : { soft: options.soft });
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

export async function expectPageToNotContainURL(page: Page, url: string, options?: ExpectOptions): Promise<void> {
  const assert = getExpectWithSoftOption(options);
  await assert(page).not.toHaveURL(new RegExp(url), options);
}
