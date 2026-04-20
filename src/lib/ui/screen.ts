import type { Page } from '@playwright/test';
import { createScreenActions, type ScreenActions } from './actions';
import { createScreenAssertions, type ScreenAssertions } from './assertions';

export type ScreenDriver = ScreenActions &
  ScreenAssertions &
  Readonly<{
    actions: ScreenActions;
    assertions: ScreenAssertions;
  }>;

export function createScreenDriver(page: Page): ScreenDriver {
  const actions = createScreenActions(page);
  const assertions = createScreenAssertions(page);

  return {
    ...actions,
    ...assertions,
    actions,
    assertions,
  };
}
