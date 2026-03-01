import { type Locator, type Page } from '@playwright/test';
import { type TimeoutOption } from '../types/playwright-types';
import { getAllLocators, getLocator } from './locator-utils';
import { INSTANT_TIMEOUT, SMALL_TIMEOUT } from '../config/timeout-constants';

export async function getText(page: Page, input: string | Locator, options?: TimeoutOption): Promise<string> {
  return await getLocator(page, input).innerText(options);
}

export async function getAllTexts(page: Page, input: string | Locator): Promise<Array<string>> {
  return await getLocator(page, input).allInnerTexts();
}

export async function getInputValue(page: Page, input: string | Locator, options?: TimeoutOption): Promise<string> {
  return await getLocator(page, input).inputValue(options);
}

export async function getAllInputValues(
  page: Page,
  input: string | Locator,
  options?: TimeoutOption,
): Promise<Array<string>> {
  const locators = await getAllLocators(page, input);
  return Promise.all(locators.map(locator => getInputValue(page, locator, options)));
}

export async function getAttribute(
  page: Page,
  input: string | Locator,
  attributeName: string,
  options?: TimeoutOption,
): Promise<null | string> {
  return await getLocator(page, input).getAttribute(attributeName, options);
}

export async function getLocatorCount(page: Page, input: string | Locator, options?: TimeoutOption): Promise<number> {
  const timeoutInMs = options?.timeout ?? INSTANT_TIMEOUT;
  try {
    if (await isElementAttached(page, input, { timeout: timeoutInMs })) {
      return (await getAllLocators(page, input)).length;
    }
  } catch (error) {
    console.log(`getLocatorCount- ${error instanceof Error ? error.message : String(error)}`);
  }
  return 0;
}

export async function isElementAttached(
  page: Page,
  input: string | Locator,
  options?: TimeoutOption,
): Promise<boolean> {
  try {
    await getLocator(page, input).waitFor({ state: 'attached', timeout: options?.timeout ?? SMALL_TIMEOUT });
    return true;
  } catch (error) {
    console.log(`isElementAttached- ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

export async function isElementVisible(page: Page, input: string | Locator, options?: TimeoutOption): Promise<boolean> {
  try {
    await getLocator(page, input).waitFor({ state: 'visible', timeout: options?.timeout ?? SMALL_TIMEOUT });
    return true;
  } catch {
    return false;
  }
}

export async function isElementHidden(page: Page, input: string | Locator, options?: TimeoutOption): Promise<boolean> {
  try {
    await getLocator(page, input).waitFor({ state: 'hidden', timeout: options?.timeout ?? SMALL_TIMEOUT });
    return true;
  } catch {
    return false;
  }
}

export async function isElementChecked(page: Page, input: string | Locator, options?: TimeoutOption): Promise<boolean> {
  try {
    if (await isElementVisible(page, input, options)) {
      return await getLocator(page, input).isChecked(options);
    }
  } catch (error) {
    console.log(`isElementChecked- ${error instanceof Error ? error.message : String(error)}`);
  }
  return false;
}
