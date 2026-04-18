import type { Locator, Page, Response } from '@playwright/test';
import type {
  ClickOptions,
  FillOptions,
  GotoOptions,
  NavigationOptions,
  PressSequentiallyOptions,
  SelectOptions,
  WaitForLoadStateOptions,
} from '@lib/types';
import { LOADSTATE, TIMEOUTS } from '@lib/config';

function toLocator(page: Page, input: string | Locator): Locator {
  return typeof input === 'string' ? page.locator(input) : input;
}

export async function gotoURL(
  page: Page,
  path: string,
  options: GotoOptions = { waitUntil: LOADSTATE },
): Promise<Response | null> {
  return page.goto(path, options);
}

export async function waitForPageLoadState(page: Page, options?: NavigationOptions): Promise<void> {
  const waitUntil: WaitForLoadStateOptions =
    options?.waitUntil && options.waitUntil !== 'commit' ? options.waitUntil : LOADSTATE;
  await page.waitForLoadState(waitUntil);
}

export async function reloadPage(page: Page, options?: NavigationOptions): Promise<void> {
  await page.reload(options);
  await waitForPageLoadState(page, options);
}

export async function clickAndNavigate(page: Page, input: string | Locator, options?: ClickOptions): Promise<void> {
  const timeout = options?.timeout ?? TIMEOUTS.standard;
  await Promise.all([toLocator(page, input).click(options), page.waitForEvent('framenavigated', { timeout })]);
  await page.waitForLoadState(options?.loadState ?? LOADSTATE, { timeout });
}

export async function fillAndEnter(
  page: Page,
  input: string | Locator,
  value: string,
  options?: FillOptions,
): Promise<void> {
  const locator = toLocator(page, input);
  await locator.fill(value, options);
  await locator.press('Enter');
}

export async function typeSequentially(
  page: Page,
  input: string | Locator,
  value: string,
  options?: PressSequentiallyOptions,
): Promise<void> {
  const locator = toLocator(page, input);
  await locator.click();
  await locator.pressSequentially(value, options);
}

export async function selectByLabel(
  page: Page,
  input: string | Locator,
  label: string,
  options?: SelectOptions,
): Promise<void> {
  await toLocator(page, input).selectOption({ label }, options);
}

export async function selectByValue(
  page: Page,
  input: string | Locator,
  value: string,
  options?: SelectOptions,
): Promise<void> {
  await toLocator(page, input).selectOption({ value }, options);
}

export async function selectByIndex(
  page: Page,
  input: string | Locator,
  index: number,
  options?: SelectOptions,
): Promise<void> {
  await toLocator(page, input).selectOption({ index }, options);
}
