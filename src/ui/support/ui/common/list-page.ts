import type { Locator } from '@playwright/test';
import type { SnapshotMaskOption } from '../snapshot';

export const SHARED_LIST_TEST_IDS = {
  defaultEmptyState: 'no-data-state',
  searchClearButton: 'search-clear-button',
  searchInput: 'search-input',
} as const;

export type ListPageRegion = 'header' | 'list' | 'emptyState';

export type ScreenshotOptions = SnapshotMaskOption &
  Readonly<{
    region?: ListPageRegion;
  }>;

export function snapshotRegion(region: ListPageRegion, regions: Record<ListPageRegion, Locator>): Locator {
  return regions[region];
}
