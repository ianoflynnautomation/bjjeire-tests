import type { Page } from '@playwright/test';

type BoundFn<T> = T extends (page: Page, ...args: infer A) => infer R ? (...args: A) => R : T;

export type BoundPageObject<T> = {
  [K in keyof T]: BoundFn<T[K]>;
};

export function bindPage<T extends Record<string, unknown>>(mod: T, page: Page): BoundPageObject<T> {
  const bound: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(mod)) {
    bound[key] =
      typeof value === 'function'
        ? (...args: unknown[]) => (value as (...rest: unknown[]) => unknown)(page, ...args)
        : value;
  }
  return bound as BoundPageObject<T>;
}
