import { test as base, expect } from '@playwright/test';
import { apiAuthHeaders } from '@api/support';
import { buildTraceHeaders, testTraceContext, traceAnnotations } from '@shared/otel/trace-context';

export type ApiOptions = {
  /**
   * How the request context authenticates.
   *
   * `'default'` follows the environment: a bearer token on protected targets
   * (dev/staging), nothing locally. `'none'` withholds the bearer so a spec can
   * assert the API rejects an anonymous caller — an *option*, so a whole file
   * opts in with `test.use({ requestAuth: 'none' })` and every other spec keeps
   * the default. Cloudflare Access headers are unaffected: they get the request
   * past the edge, which is a separate concern from the API's own authorization.
   */
  requestAuth: 'default' | 'none';
};

export const test = base.extend<ApiOptions>({
  requestAuth: ['default', { option: true }],

  extraHTTPHeaders: async ({ extraHTTPHeaders, requestAuth }, use, testInfo) => {
    const trace = testTraceContext(testInfo.testId, testInfo.retry);
    testInfo.annotations.push(...traceAnnotations(trace));

    await use({
      ...extraHTTPHeaders,
      ...buildTraceHeaders(trace),
      ...(requestAuth === 'none' ? {} : await apiAuthHeaders()),
    });
  },
});

export { expect };
