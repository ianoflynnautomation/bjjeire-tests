import { type Locator, type Page } from '@playwright/test';

export type GotoOptions = Parameters<Page['goto']>[1];
export type NavigationOptions = Parameters<Page['reload']>[0];
export type WaitForLoadStateOptions = Parameters<Page['waitForLoadState']>[0];

export type ClickOptions = Parameters<Locator['click']>[0] & {
  loadState?: WaitForLoadStateOptions;
};

export type FillOptions = Parameters<Locator['fill']>[1];
export type PressSequentiallyOptions = Parameters<Locator['pressSequentially']>[1];
export type SelectValues = Parameters<Locator['selectOption']>[0];
export type SelectOptions = Parameters<Locator['selectOption']>[1];
export type DragOptions = Parameters<Locator['dragTo']>[1];

export type TimeoutOption = { timeout?: number };
export type SoftOption = { soft?: boolean };
export type ExpectOptions = TimeoutOption & SoftOption & { message?: string };
export type ExpectTextOptions = {
  ignoreCase?: boolean;
  useInnerText?: boolean;
};

export type LocatorOptions = Parameters<Page['locator']>[1];
export type GetByTextOptions = Parameters<Locator['getByText']>[1];
export type GetByRoleTypes = Parameters<Locator['getByRole']>[0];
export type GetByRoleOptions = Parameters<Locator['getByRole']>[1];
export type GetByPlaceholderOptions = Parameters<Locator['getByPlaceholder']>[1];
