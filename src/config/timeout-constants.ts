import type { WaitForLoadStateOptions } from '../types/playwright-types';

export const LOADSTATE: WaitForLoadStateOptions = 'domcontentloaded';

export const INSTANT_TIMEOUT = 1_000;
export const SMALL_TIMEOUT = 5_000;
export const STANDARD_TIMEOUT = 15_000;
export const BIG_TIMEOUT = 30_000;
export const MAX_TIMEOUT = 60_000;
export const EXPECT_TIMEOUT = 5_000;
export const ACTION_TIMEOUT = 10_000;
export const NAVIGATION_TIMEOUT = 30_000;
export const TEST_TIMEOUT = 2 * 60_000;
