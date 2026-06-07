import { test as base, expect, type APIRequestContext } from '@playwright/test';
import { createRequestContext } from '@api/support';

export type ApiFixtures = {
  apiClient: APIRequestContext;
};

export type ApiWorkerFixtures = {
  sharedApiClient: APIRequestContext;
};

export const test = base.extend<ApiFixtures, ApiWorkerFixtures>({
  // Worker-scoped read-only client. Use in tests that don't need a fresh
  // context, custom headers, or a different token — minted once per worker.
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

  // Test-scoped client. Use when a test needs isolation or to mutate headers/
  // tokens via createRequestContext directly.
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
