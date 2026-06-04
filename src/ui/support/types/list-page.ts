import type { SnapshotMaskOption } from '../snapshot';

export type ListPageRegion = 'header' | 'list' | 'emptyState';

export type ScreenshotOptions = SnapshotMaskOption &
  Readonly<{
    region?: ListPageRegion;
  }>;
