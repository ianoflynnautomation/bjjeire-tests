import type { Locator } from '@playwright/test';
import { getPage } from '@ui/support/ui';

export function navigation(): Locator {
  return getPage().getByRole('navigation');
}

export function logoLink(): Locator {
  return getPage().getByTestId('navigation-logo-link');
}
