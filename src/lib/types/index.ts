import type { Locator, Page } from '@playwright/test';

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

export type TimeoutOption = { timeout?: number };
export type SoftOption = { soft?: boolean };
export type ExpectOptions = TimeoutOption & SoftOption & { message?: string };
export type ExpectTextOptions = {
  ignoreCase?: boolean;
  useInnerText?: boolean;
};

export type LocatorOptions = Parameters<Page['locator']>[1];
export type GetByRoleTypes = Parameters<Locator['getByRole']>[0];
export type GetByRoleOptions = Parameters<Locator['getByRole']>[1];
export type GetByTextOptions = Parameters<Locator['getByText']>[1];

export type Brand<T, B extends string> = T & { readonly __brand: B };
export type RunId = Brand<string, 'RunId'>;
export type EntityId = Brand<string, 'EntityId'>;

export type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};
