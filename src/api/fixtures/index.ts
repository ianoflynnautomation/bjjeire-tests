import { test as base, expect, type APIRequestContext } from '@playwright/test';
import { buildTraceHeaders, createRequestContext, generateTraceContext } from '@api/support';

export type ApiFixtures = {
  apiClient: APIRequestContext;
};

export type ApiWorkerFixtures = {
  sharedApiClient: APIRequestContext;
};

export const test = base.extend<ApiFixtures, ApiWorkerFixtures>({
  // Worker-scoped read-only client. Use in tests that don't need a fresh
  // context, custom headers, or a different token — minted once per worker.
  // All requests on this client share one trace_id (worker-wide); switch to
  // apiClient when per-test trace correlation matters.
  sharedApiClient: [
    async ({}, use) => {
      const trace = generateTraceContext();
      const context = await createRequestContext({ extraHeaders: buildTraceHeaders(trace) });
      try {
        await use(context);
      } finally {
        await context.dispose();
      }
    },
    { scope: 'worker' },
  ],

  apiClient: async ({}, use, testInfo) => {
    const trace = generateTraceContext();
    testInfo.annotations.push({ type: 'trace-id', description: trace.traceId });
    const context = await createRequestContext({ extraHeaders: buildTraceHeaders(trace) });
    try {
      await use(context);
    } finally {
      await context.dispose();
    }
  },
});

export { expect };
