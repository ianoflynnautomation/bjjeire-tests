import { selectors, type FrameLocator, type Locator } from '@playwright/test';
import { getPage } from '../contexts/page-context';
import {
  type GetByLabelOptions,
  type GetByPlaceholderOptions,
  type GetByRoleOptions,
  type GetByRoleType,
  type GetByTextOptions,
  type LocatorOptions,
} from './types/optional-parameter-types';

export function getLocator(input: string | Locator, options?: LocatorOptions): Locator {
  return typeof input === 'string' ? getPage().locator(input, options) : input;
}

export function getLocatorByTestId(testId: string | RegExp, attributeName?: string): Locator {
  if (attributeName) {
    selectors.setTestIdAttribute(attributeName);
  }
  return getPage().getByTestId(testId);
}

export function getLocatorByText(text: string | RegExp, options?: GetByTextOptions): Locator {
  return getPage().getByText(text, options);
}

export function getLocatorByRole(role: GetByRoleType, options?: GetByRoleOptions): Locator {
  return getPage().getByRole(role, options);
}

export function getLocatorByLabel(text: string | RegExp, options?: GetByLabelOptions): Locator {
  return getPage().getByLabel(text, options);
}

export function getLocatorByPlaceholder(text: string | RegExp, options?: GetByPlaceholderOptions): Locator {
  return getPage().getByPlaceholder(text, options);
}

export function getAllLocators(input: string | Locator, options?: LocatorOptions): Promise<Locator[]> {
  return typeof input === 'string' ? getPage().locator(input, options).all() : input.all();
}

export function getFrameLocator(frameInput: string | FrameLocator): FrameLocator {
  return typeof frameInput === 'string' ? getPage().frameLocator(frameInput) : frameInput;
}

export function getLocatorByName(name: string | RegExp, options?: LocatorOptions): Locator {
  return getPage().locator(`[name=${typeof name === 'string' ? `"${name}"` : ''}]`, options);
}

export function getLocatorById(id: string | RegExp, options?: LocatorOptions): Locator {
  if (typeof id === 'string') {
    return getPage().locator(`#${CSS.escape(id)}`, options);
  }
  return getPage().locator(`[id]`, options).filter({ hasText: id });
}

export function getLocatorInFrame(frameInput: string | FrameLocator, input: string | Locator): Locator {
  return getFrameLocator(frameInput).locator(input);
}
