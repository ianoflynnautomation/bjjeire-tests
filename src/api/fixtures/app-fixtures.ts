import { test as base, expect } from '@playwright/test';
import { createRequestContext, type FeatureFlagMap } from '@api/support/api';

export type AppFixtures = {
  featureFlags: FeatureFlagMap;
};

export const test = base.extend<object, AppFixtures>({
  featureFlags: [
    async ({}, use) => {
      const ctx = await createRequestContext();
      const response = await ctx.get('/api/FeatureFlag');
      const flags: FeatureFlagMap = response.ok() ? ((await response.json()) as FeatureFlagMap) : {};
      await ctx.dispose();
      await use(flags);
    },
    { scope: 'worker', box: true },
  ],
});

export { expect };
