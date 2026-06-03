import { test as base, expect, type APIRequestContext } from '@playwright/test';
import { createRequestContext } from '@api/support/api';

export type SharedFixtures = {};

export type SharedWorkerFixtures = {
  apiClient: APIRequestContext;
};

export const test = base.extend<SharedFixtures, SharedWorkerFixtures>({
  apiClient: [
    async ({}, use) => {
      const ctx = await createRequestContext();
      try {
        await use(ctx);
      } finally {
        await ctx.dispose();
      }
    },
    { scope: 'worker' },
  ],
});

export { expect };
