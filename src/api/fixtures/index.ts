import { test as base, expect, type APIRequestContext } from '@playwright/test';
import { buildTraceHeaders, createRequestContext, testTraceContext, traceAnnotations } from '@api/support';

export type ApiFixtures = {
  apiClient: APIRequestContext;
};

export const test = base.extend<ApiFixtures>({
  apiClient: async ({}, use, testInfo) => {
    const trace = testTraceContext(testInfo.testId, testInfo.retry);
    testInfo.annotations.push(...traceAnnotations(trace));
    const context = await createRequestContext({ extraHeaders: buildTraceHeaders(trace) });
    try {
      await use(context);
    } finally {
      await context.dispose();
    }
  },
});

export { expect };
