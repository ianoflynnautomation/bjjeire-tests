import type { Page } from '@playwright/test';

export type BoundPageObject<T> = {
  [K in keyof T]: T[K] extends (page: Page, ...args: infer A) => infer R ? (...args: A) => R : T[K];
};

export function bindPage<T extends object>(mod: T, page: Page): BoundPageObject<T> {
  const bound: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(mod)) {
    bound[key] =
      typeof value === 'function'
        ? (...args: unknown[]) => (value as (...rest: unknown[]) => unknown)(page, ...args)
        : value;
  }
  return bound as BoundPageObject<T>;
}
