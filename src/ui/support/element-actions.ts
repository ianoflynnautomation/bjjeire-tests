import type { Locator } from '@playwright/test';
import {
  type CheckOptions,
  type ClearOptions,
  type ClickOptions,
  type HoverOptions,
  type SelectOptions,
  type TimeoutOption,
  type TypeOptions,
} from './types/optional-parameter-types';

export async function clearInput(locator: Locator, options?: ClearOptions): Promise<void> {
  await locator.clear(options);
}

export async function fillInput(locator: Locator, value: string, options?: TypeOptions): Promise<void> {
  await locator.fill(value, options);
}

export async function click(locator: Locator, options?: ClickOptions): Promise<void> {
  await locator.click(options);
}

export async function check(locator: Locator, options?: CheckOptions): Promise<void> {
  await locator.check(options);
}

export async function uncheck(locator: Locator, options?: CheckOptions): Promise<void> {
  await locator.uncheck(options);
}

export async function selectByValue(locator: Locator, value: string, options?: SelectOptions): Promise<void> {
  await locator.selectOption({ value: value }, options);
}

export async function selectByValues(locator: Locator, value: string[], options?: SelectOptions): Promise<void> {
  await locator.selectOption(value, options);
}

export async function selectByText(locator: Locator, text: string, options?: SelectOptions): Promise<void> {
  await locator.selectOption({ label: text }, options);
}

export async function hover(locator: Locator, options?: HoverOptions): Promise<void> {
  await locator.hover(options);
}

export async function focus(locator: Locator, options?: TimeoutOption): Promise<void> {
  await locator.focus(options);
}

export async function getText(locator: Locator, options?: TimeoutOption): Promise<string> {
  return (await locator.innerText(options)).trim();
}

export async function getInputValue(locator: Locator, options?: TimeoutOption): Promise<string> {
  return locator.inputValue(options);
}

export async function readTextIfVisible(locator: Locator, options?: TimeoutOption): Promise<string | null> {
  if (!(await locator.isVisible(options))) {
    return null;
  }

  return getText(locator, options);
}
