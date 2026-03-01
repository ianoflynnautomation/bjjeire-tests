import { type Locator, type Page, type Response } from '@playwright/test';
import {
  type ClickOptions,
  type DragOptions,
  type FillOptions,
  type GotoOptions,
  type NavigationOptions,
  type PressSequentiallyOptions,
  type SelectOptions,
  type WaitForLoadStateOptions,
} from '../types/playwright-types';
import { LOADSTATE, STANDARD_TIMEOUT } from '../config/timeout-constants';
import { getLocator } from './locator-utils';

export async function gotoURL(
  page: Page,
  path: string,
  options: GotoOptions = { waitUntil: LOADSTATE },
): Promise<null | Response> {
  return await page.goto(path, options);
}

export async function waitForPageLoadState(page: Page, options?: NavigationOptions): Promise<void> {
  let waitUntil: WaitForLoadStateOptions = LOADSTATE;
  if (options?.waitUntil && options.waitUntil !== 'commit') {
    waitUntil = options.waitUntil;
  }
  await page.waitForLoadState(waitUntil);
}

export async function reloadPage(page: Page, options?: NavigationOptions): Promise<void> {
  await page.reload(options);
  await waitForPageLoadState(page, options);
}

export async function goBack(page: Page, options?: NavigationOptions): Promise<void> {
  await page.goBack(options);
  await waitForPageLoadState(page, options);
}

export async function clickAndNavigate(page: Page, input: string | Locator, options?: ClickOptions): Promise<void> {
  const timeout = options?.timeout ?? STANDARD_TIMEOUT;
  await Promise.all([getLocator(page, input).click(options), page.waitForEvent('framenavigated', { timeout })]);
  await page.waitForLoadState(options?.loadState ?? LOADSTATE, { timeout });
}

export async function fillAndEnter(
  page: Page,
  input: string | Locator,
  value: string,
  options?: FillOptions,
): Promise<void> {
  const locator = getLocator(page, input);
  await locator.fill(value, options);
  await locator.press('Enter');
}

export async function typeSequentially(
  page: Page,
  input: string | Locator,
  value: string,
  options?: PressSequentiallyOptions,
): Promise<void> {
  const locator = getLocator(page, input);
  await locator.click();
  await locator.pressSequentially(value, options);
}

export async function selectByValue(
  page: Page,
  input: string | Locator,
  value: string,
  options?: SelectOptions,
): Promise<void> {
  await getLocator(page, input).selectOption({ value }, options);
}

export async function selectByValues(
  page: Page,
  input: string | Locator,
  values: Array<string>,
  options?: SelectOptions,
): Promise<void> {
  await getLocator(page, input).selectOption(values, options);
}

export async function selectByText(
  page: Page,
  input: string | Locator,
  text: string,
  options?: SelectOptions,
): Promise<void> {
  await getLocator(page, input).selectOption({ label: text }, options);
}

export async function selectByIndex(
  page: Page,
  input: string | Locator,
  index: number,
  options?: SelectOptions,
): Promise<void> {
  await getLocator(page, input).selectOption({ index }, options);
}

export async function acceptAlert(page: Page, input: string | Locator, promptText?: string): Promise<string> {
  // Register the waitForEvent promise BEFORE triggering the click so the
  // dialog is never missed regardless of how quickly it fires.
  const dialogPromise = page.waitForEvent('dialog');
  await getLocator(page, input).click();
  const dialog = await dialogPromise;
  const message = dialog.message();
  await dialog.accept(promptText);
  return message;
}

export async function dismissAlert(page: Page, input: string | Locator): Promise<string> {
  const dialogPromise = page.waitForEvent('dialog');
  await getLocator(page, input).click();
  const dialog = await dialogPromise;
  const message = dialog.message();
  await dialog.dismiss();
  return message;
}

export async function getAlertText(page: Page, input: string | Locator): Promise<string> {
  const dialogPromise = page.waitForEvent('dialog');
  await getLocator(page, input).click();
  const dialog = await dialogPromise;
  const message = dialog.message();
  await dialog.dismiss();
  return message;
}

export async function dragAndDrop(
  page: Page,
  input: string | Locator,
  dest: string | Locator,
  options?: DragOptions,
): Promise<void> {
  await getLocator(page, input).dragTo(getLocator(page, dest), options);
}

export async function downloadFile(page: Page, input: string | Locator, savePath: string): Promise<void> {
  const downloadPromise = page.waitForEvent('download');
  await getLocator(page, input).click();
  const download = await downloadPromise;
  await download.saveAs(savePath);
}

export async function clickByJS(page: Page, input: string | Locator): Promise<void> {
  const locator = getLocator(page, input);
  await locator.waitFor({ state: 'visible' });
  await locator.evaluate((el: HTMLElement) => el.click());
}
