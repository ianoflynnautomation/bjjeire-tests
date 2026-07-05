import { test as base, expect, type APIRequestContext } from '@playwright/test';
import { buildTraceHeaders, createRequestContext, generateTraceContext } from '@api/support';

export type ApiFixtures = {
  apiClient: APIRequestContext;
};

export const test = base.extend<ApiFixtures>({
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
