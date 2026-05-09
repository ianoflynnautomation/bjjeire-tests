import { test as base, expect, type APIRequestContext } from '@playwright/test';
import { createRequestContext } from '@api/support/api';

export type SharedFixtures = {
  apiClient: APIRequestContext;
};

export const test = base.extend<SharedFixtures>({
  apiClient: async ({}, use) => {
    const ctx = await createRequestContext();
    try {
      await use(ctx);
    } finally {
      await ctx.dispose();
    }
  },
});

export { expect };
