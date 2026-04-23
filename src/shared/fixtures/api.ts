import { test as base, expect, type APIRequestContext } from '@playwright/test';
import { createRequestContext, type FeatureFlagMap } from '@api/support/api';

export type SharedFixtures = {
  apiClient: APIRequestContext;
};

export type SharedWorkerFixtures = {
  featureFlags: FeatureFlagMap;
};

export const test = base.extend<SharedFixtures, SharedWorkerFixtures>({
  apiClient: async ({}, use) => {
    const ctx = await createRequestContext();
    try {
      await use(ctx);
    } finally {
      await ctx.dispose();
    }
  },

  featureFlags: [
    async ({}, use) => {
      const ctx = await createRequestContext();
      try {
        const response = await ctx.get('/api/FeatureFlag');
        const flags: FeatureFlagMap = response.ok() ? ((await response.json()) as FeatureFlagMap) : {};
        await use(flags);
      } finally {
        await ctx.dispose();
      }
    },
    { scope: 'worker', box: true },
  ],
});

export { expect };
