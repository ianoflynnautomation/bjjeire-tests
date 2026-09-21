import { test as base, expect } from '@playwright/test';
import { apiAuthHeaders } from '@api/support';
import { buildTraceHeaders, testTraceContext, traceAnnotations } from '@shared/otel/trace-context';

export const test = base.extend({
  extraHTTPHeaders: async ({ extraHTTPHeaders }, use, testInfo) => {
    const trace = testTraceContext(testInfo.testId, testInfo.retry);
    testInfo.annotations.push(...traceAnnotations(trace));

    await use({
      ...extraHTTPHeaders,
      ...buildTraceHeaders(trace),
      ...(await apiAuthHeaders()),
    });
  },
});

export { expect };
