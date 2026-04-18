import { test as base, expect, type APIRequestContext } from '@playwright/test';
import type { Db } from 'mongodb';
import { createApiClient, createRequestContext, type ApiClient, type FeatureFlagMap } from '@lib/api';
import { acquireAzureToken, type AzureRole } from '@lib/auth';
import { env } from '@lib/config';
import { connectMongo, cleanupByRunId } from '@lib/db';
import { createTestRunId, workerRunId } from '@lib/factories';
import type { RunId } from '@lib/types';

export type WorkerFixtures = {
  workerRunId: RunId;
  mongoDb: Db;
  featureFlags: FeatureFlagMap;
};

export type TestFixtures = {
  runId: RunId;
  apiContext: APIRequestContext;
  apiClient: ApiClient;
  authToken: string;
  authenticatedApiClient: ApiClient;
  role: AzureRole;
  cleanupCollections: readonly string[];
};

export const test = base.extend<TestFixtures, WorkerFixtures>({
  workerRunId: [
    async ({}, use) => {
      await use(workerRunId());
    },
    { scope: 'worker' },
  ],

  mongoDb: [
    async ({}, use) => {
      const handle = await connectMongo();
      await use(handle.db);
      await handle.close();
    },
    { scope: 'worker' },
  ],

  featureFlags: [
    async ({}, use) => {
      const ctx = await createRequestContext();
      const response = await ctx.get('/api/FeatureFlag');
      const flags: FeatureFlagMap = response.ok() ? ((await response.json()) as FeatureFlagMap) : {};
      await ctx.dispose();
      await use(flags);
    },
    { scope: 'worker' },
  ],

  role: ['user' as AzureRole, { option: true }],

  cleanupCollections: [[], { option: true }],

  runId: async ({}, use, testInfo) => {
    await use(createTestRunId(testInfo.title, testInfo.workerIndex));
  },

  apiContext: async ({}, use) => {
    const ctx = await createRequestContext();
    await use(ctx);
    await ctx.dispose();
  },

  apiClient: async ({ apiContext }, use) => {
    await use(createApiClient(apiContext));
  },

  authToken: async ({ role }, use) => {
    if (!env.azure.clientId) {
      await use('');
      return;
    }
    const token = await acquireAzureToken({ role });
    await use(token.accessToken);
  },

  authenticatedApiClient: async ({ authToken }, use) => {
    const ctx = await createRequestContext({ token: authToken });
    await use(createApiClient(ctx));
    await ctx.dispose();
  },

  page: async ({ page, mongoDb, runId, cleanupCollections }, use) => {
    await use(page);
    if (cleanupCollections.length > 0) {
      await cleanupByRunId(mongoDb, runId, cleanupCollections);
    }
  },
});

export { expect };
