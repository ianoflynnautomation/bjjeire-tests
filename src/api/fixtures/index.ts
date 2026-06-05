import { test as base, expect, type APIRequestContext } from '@playwright/test';
import { createRequestContext, type RequestContextOptions } from '@api/support/api';

export type ApiClientFactory = (options?: RequestContextOptions) => Promise<APIRequestContext>;

export type ApiFixtures = {
  apiClient: APIRequestContext;
  createApiClient: ApiClientFactory;
};

export const test = base.extend<ApiFixtures>({
  createApiClient: async ({}, use) => {
    const contexts: APIRequestContext[] = [];

    try {
      await use(async (options = {}) => {
        const context = await createRequestContext(options);
        contexts.push(context);
        return context;
      });
    } finally {
      await Promise.all(contexts.map(context => context.dispose()));
    }
  },

  apiClient: async ({}, use) => {
    const context = await createRequestContext();

    try {
      await use(context);
    } finally {
      await context.dispose();
    }
  },
});

export { expect };
