import {
  test as base,
  expect,
  type APIRequestContext,
  type BrowserContext,
  type BrowserContextOptions,
  type Page,
} from '@playwright/test';
import type { Db } from 'mongodb';
import { createApiClient, createRequestContext, type ApiClient, type FeatureFlagMap } from '@shared/api';
import { acquireAzureToken, type AzureRole } from '@shared/auth';
import { env } from '@shared/config';
import { connectMongo, cleanupByRunId } from '@shared/db';
import { createTestRunId, workerRunId } from '@shared/factories';
import type { RunId } from '@core/types';
import { hasStorageStateForRole, storageStatePathForRole, type AuthRole } from './storage-state';

export type AppWorkerFixtures = {
  workerRunId: RunId;
  mongoDb: Db;
  featureFlags: FeatureFlagMap;
};

export type AppTestFixtures = {
  runId: RunId;
  apiContext: APIRequestContext;
  apiClient: ApiClient;
  authToken: string;
  authenticatedApiClient: ApiClient;
  role: AzureRole;
  cleanupCollections: readonly string[];
  authRole: AuthRole;
  authStorageStatePath: string | undefined;
  authedContext: BrowserContext;
  authedPage: Page;
};

export const test = base.extend<AppTestFixtures, AppWorkerFixtures>({
  workerRunId: [
    async ({}, use) => {
      await use(workerRunId());
    },
    { scope: 'worker', box: true },
  ],

  mongoDb: [
    async ({}, use) => {
      const handle = await connectMongo();
      await use(handle.db);
      await handle.close();
    },
    { scope: 'worker', box: true },
  ],

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

  role: ['user' as AzureRole, { option: true }],

  cleanupCollections: [[], { option: true }],

  authRole: ['anonymous', { option: true }],

  authStorageStatePath: async ({ authRole }, use) => {
    const storageStatePath = storageStatePathForRole(authRole);

    if (!storageStatePath) {
      await use(undefined);
      return;
    }

    if (!hasStorageStateForRole(authRole)) {
      throw new Error(
        `Missing storage state for role '${authRole}' at '${storageStatePath}'. ` +
          `Generate it before using authenticated UI fixtures.`,
      );
    }

    await use(storageStatePath);
  },

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

  authedContext: async ({ browser, authStorageStatePath, baseURL, locale, timezoneId, viewport }, use) => {
    const contextOptions: BrowserContextOptions = {
      ...(baseURL ? { baseURL } : {}),
      ...(locale ? { locale } : {}),
      ...(timezoneId ? { timezoneId } : {}),
      ...(viewport ? { viewport } : {}),
      ...(authStorageStatePath ? { storageState: authStorageStatePath } : {}),
    };

    const context = await browser.newContext(contextOptions);

    await use(context);
    await context.close();
  },

  authedPage: async ({ authedContext }, use) => {
    const page = await authedContext.newPage();
    await use(page);
  },

  page: async ({ page, mongoDb, runId, cleanupCollections }, use) => {
    await use(page);

    if (cleanupCollections.length > 0) {
      await cleanupByRunId(mongoDb, runId, cleanupCollections);
    }
  },
});

export { expect };
