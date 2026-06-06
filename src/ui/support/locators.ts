import { selectors, type FrameLocator, type Locator, type Page } from '@playwright/test';
import {
  type GetByLabelOptions,
  type GetByPlaceholderOptions,
  type GetByRoleOptions,
  type GetByRoleType,
  type GetByTextOptions,
  type LocatorOptions,
} from './types/optional-parameter-types';

export function getLocator(page: Page, input: string | Locator, options?: LocatorOptions): Locator {
  return typeof input === 'string' ? page.locator(input, options) : input;
}

export function getLocatorByTestId(page: Page, testId: string | RegExp, attributeName?: string): Locator {
  if (attributeName) {
    selectors.setTestIdAttribute(attributeName);
  }
  return page.getByTestId(testId);
}

export function getLocatorByText(page: Page, text: string | RegExp, options?: GetByTextOptions): Locator {
  return page.getByText(text, options);
}

export function getLocatorByRole(page: Page, role: GetByRoleType, options?: GetByRoleOptions): Locator {
  return page.getByRole(role, options);
}

export function getLocatorByLabel(page: Page, text: string | RegExp, options?: GetByLabelOptions): Locator {
  return page.getByLabel(text, options);
}

export function getLocatorByPlaceholder(page: Page, text: string | RegExp, options?: GetByPlaceholderOptions): Locator {
  return page.getByPlaceholder(text, options);
}

export function getAllLocators(page: Page, input: string | Locator, options?: LocatorOptions): Promise<Locator[]> {
  return typeof input === 'string' ? page.locator(input, options).all() : input.all();
}

export function getFrameLocator(page: Page, frameInput: string | FrameLocator): FrameLocator {
  return typeof frameInput === 'string' ? page.frameLocator(frameInput) : frameInput;
}

export function getLocatorByName(page: Page, name: string | RegExp, options?: LocatorOptions): Locator {
  return page.locator(`[name=${typeof name === 'string' ? `"${name}"` : ''}]`, options);
}

export function getLocatorById(page: Page, id: string | RegExp, options?: LocatorOptions): Locator {
  if (typeof id === 'string') {
    return page.locator(`#${CSS.escape(id)}`, options);
  }
  return page.locator(`[id]`, options).filter({ hasText: id });
}

export function getLocatorInFrame(page: Page, frameInput: string | FrameLocator, input: string | Locator): Locator {
  return getFrameLocator(page, frameInput).locator(input);
}
