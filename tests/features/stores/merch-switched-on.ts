import { z } from 'zod';
import { test, expect } from '@api/fixtures';
import { API_ROUTES, apiAuthHeaders, expectSchema } from '@api/support';
import { MERCH_FLAG_MISMATCH_MESSAGE } from './merch-flag-mismatch';

const featureFlagsSchema = z.object({ Merch: z.boolean() });

/**
 * Call inside a `@merch-on` API describe. Reads the environment's `Merch` flag once per worker with the environment's
 * own auth (only the calls under test are anonymous) and returns the Given step: MERCH_FLAG selects the set, so a
 * mismatch with the real flag is a misconfiguration the step reports by name.
 */
export function merchSwitchedOnGiven(): () => void {
  let switchedOn: boolean | undefined;

  test.beforeAll(async ({ playwright }) => {
    const { baseURL, ignoreHTTPSErrors, extraHTTPHeaders } = test.info().project.use;
    const flags = await playwright.request.newContext({
      ...(baseURL ? { baseURL } : {}),
      ...(ignoreHTTPSErrors === undefined ? {} : { ignoreHTTPSErrors }),
      extraHTTPHeaders: { ...extraHTTPHeaders, ...(await apiAuthHeaders()) },
    });
    try {
      const response = await flags.get(API_ROUTES.featureFlags);
      expect(response.ok(), `${response.url()} status ${response.status()}`).toBe(true);
      switchedOn = expectSchema(featureFlagsSchema, await response.json()).Merch;
    } finally {
      await flags.dispose();
    }
  });

  return () => {
    expect(switchedOn, MERCH_FLAG_MISMATCH_MESSAGE).toBe(true);
  };
}
