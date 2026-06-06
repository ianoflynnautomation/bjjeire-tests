import { test as base, expect, type APIRequestContext } from '@playwright/test';
import { createRequestContext, type RequestContextOptions } from '@api/support/api';

export type ApiClientFactory = (options?: RequestContextOptions) => Promise<APIRequestContext>;

export type ApiFixtures = {
  apiClient: APIRequestContext;
  createApiClient: ApiClientFactory;
};

export type ApiWorkerFixtures = {
  sharedApiClient: APIRequestContext;
};

export const test = base.extend<ApiFixtures, ApiWorkerFixtures>({
  sharedApiClient: [
    async ({}, use) => {
      const context = await createRequestContext();
      try {
        await use(context);
      } finally {
        await context.dispose();
      }
    },
    { scope: 'worker' },
  ],

  apiClient: async ({}, use) => {
    const context = await createRequestContext();

    try {
      await use(context);
    } finally {
      await context.dispose();
    }
  },

  createApiClient: async ({}, use) => {
    const contexts: APIRequestContext[] = [];

    try {
      await use(async (options = {}) => {
        const context = await createRequestContext(options);
        contexts.push(context);
        return context;
      });
    } finally {
      // allSettled — one dispose failure shouldn't mask another or fail the
      // test result on a cleanup hiccup.
      const results = await Promise.allSettled(contexts.map(context => context.dispose()));
      for (const result of results) {
        if (result.status === 'rejected') {
          console.warn('[api-fixtures] APIRequestContext.dispose() failed:', result.reason);
        }
      }
    }
  },
});

export { expect };
