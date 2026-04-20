import type { Locator, Page, Response } from '@playwright/test';
import type {
  ClickOptions,
  FillOptions,
  GotoOptions,
  NavigationOptions,
  PressOptions,
  PressSequentiallyOptions,
  SelectOptions,
  ShortcutKey,
  WaitForLoadStateOptions,
} from '@lib/types';
import { LOADSTATE, TIMEOUTS } from '@lib/config';

function toLocator(page: Page, input: string | Locator): Locator {
  return typeof input === 'string' ? page.locator(input) : input;
}

function normalizeShortcut(shortcut: ShortcutKey): string {
  return typeof shortcut === 'string' ? shortcut : [...shortcut].join('+');
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

export type ScreenActions = Readonly<{
  page: Page;
  navigate: (url: string) => Promise<void>;
  click: (locator: Locator, options?: ClickOptions) => Promise<void>;
  fill: (locator: Locator, value: string, options?: FillOptions) => Promise<void>;
  clear: (locator: Locator, options?: FillOptions) => Promise<void>;
  typeSequentially: (locator: Locator, value: string, options?: PressSequentiallyOptions) => Promise<void>;
  selectByLabel: (locator: Locator, label: string, options?: SelectOptions) => Promise<void>;
  selectByIndex: (locator: Locator, index: number, options?: SelectOptions) => Promise<void>;
  press: (locator: Locator, key: string, options?: PressOptions) => Promise<void>;
  pressShortcut: (shortcut: ShortcutKey, locator?: Locator, options?: PressOptions) => Promise<void>;
}>;

export function createScreenActions(page: Page): ScreenActions {
  return {
    page,

    async navigate(url: string) {
      await page.goto(url);
    },

    async click(locator: Locator, options?: ClickOptions) {
      await locator.click(options);
    },

    async fill(locator: Locator, value: string, options?: FillOptions) {
      await locator.fill(value, options);
    },

    async clear(locator: Locator, options?: FillOptions) {
      await locator.clear(options);
    },

    async typeSequentially(locator: Locator, value: string, options?: PressSequentiallyOptions) {
      await locator.click();
      await locator.pressSequentially(value, options);
    },

    async selectByLabel(locator: Locator, label: string, options?: SelectOptions) {
      await locator.selectOption({ label }, options);
    },

    async selectByIndex(locator: Locator, index: number, options?: SelectOptions) {
      await locator.selectOption({ index }, options);
    },

    async press(locator: Locator, key: string, options?: PressOptions) {
      await locator.press(key, options);
    },

    async pressShortcut(shortcut: ShortcutKey, locator?: Locator, options?: PressOptions) {
      const key = normalizeShortcut(shortcut);
      if (locator) {
        await locator.press(key, options);
        return;
      }

      await page.keyboard.press(key, options);
    },
  };
}
