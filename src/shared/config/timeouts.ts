import type { Page } from '@playwright/test';

export type WaitForLoadState = Parameters<Page['waitForLoadState']>[0];

export const LOADSTATE = 'domcontentloaded' as const satisfies WaitForLoadState;

export const TIMEOUTS = {
  instant: 1_000,
  small: 5_000,
  standard: 15_000,
  big: 30_000,
  max: 60_000,
  expect: 5_000,
  action: 10_000,
  navigation: 30_000,
  test: 2 * 60_000,
} as const;
