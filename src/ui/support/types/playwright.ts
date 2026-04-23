import type { Locator, Page } from '@playwright/test';

export type GotoOptions = Parameters<Page['goto']>[1];
export type NavigationOptions = Parameters<Page['reload']>[0];
export type WaitForLoadStateOptions = Parameters<Page['waitForLoadState']>[0];

export type ClickOptions = Parameters<Locator['click']>[0] & {
  loadState?: WaitForLoadStateOptions;
};
export type FillOptions = Parameters<Locator['fill']>[1];
export type PressSequentiallyOptions = Parameters<Locator['pressSequentially']>[1];
export type TypeOptions = PressSequentiallyOptions;
export type HoverOptions = Parameters<Locator['hover']>[0];
export type TapOptions = Parameters<Locator['tap']>[0];
export type CheckOptions = Parameters<Locator['check']>[0];
export type PressOptions = Parameters<Locator['press']>[1];
export type DragToOptions = Parameters<Locator['dragTo']>[1];
export type ScrollIntoViewOptions = Parameters<Locator['scrollIntoViewIfNeeded']>[0];
export type SelectValues = Parameters<Locator['selectOption']>[0];
export type SelectOptions = Parameters<Locator['selectOption']>[1];
export type WaitForTargetOptions = Parameters<Locator['waitFor']>[0];
export type WaitForState = NonNullable<NonNullable<WaitForTargetOptions>['state']>;
export type WaitForResponsePredicate = Parameters<Page['waitForResponse']>[0];
export type UploadFilesPayload = Parameters<Locator['setInputFiles']>[0];

export type TimeoutOption = { timeout?: number };
export type SoftOption = { soft?: boolean };
export type ExpectOptions = TimeoutOption & SoftOption & { message?: string };
export type ExpectTextOptions = {
  ignoreCase?: boolean;
  useInnerText?: boolean;
};
export type ExpectAttributeOptions = ExpectOptions & { ignoreCase?: boolean };
export type ExpectClassOptions = ExpectOptions;
export type FocusOptions = TimeoutOption;
export type BlurOptions = TimeoutOption;
export type CountOptions = TimeoutOption;

export type LocatorOptions = Parameters<Page['locator']>[1];
export type GetByRoleTypes = Parameters<Locator['getByRole']>[0];
export type GetByRoleOptions = Parameters<Locator['getByRole']>[1];
export type GetByTextOptions = Parameters<Locator['getByText']>[1];

export type LocatorLike = Page | Locator | string;
export type LocatorOrPage = Page | Locator;
export type ResolvedTarget = { page: Page; locator: Locator };
export type ShortcutKey = string | readonly string[];
