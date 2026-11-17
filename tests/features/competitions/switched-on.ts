import { z } from 'zod';
import { test, expect } from '@api/fixtures';
import { API_ROUTES, apiAuthHeaders, expectSchema } from '@api/support';
import { FLAG_MISMATCH_MESSAGE } from './flag-mismatch';

const featureFlagsSchema = z.object({ BjjEireCompetitions: z.boolean() });

/**
 * Call inside a `@bjjeire-competitions-on` API describe. Reads the environment's `BjjEireCompetitions` flag once per
 * worker with the environment's own auth (only the calls under test are anonymous) and returns the Given step:
 * BJJEIRE_COMPETITIONS_FLAG selects the set, so a mismatch with the real flag is a misconfiguration the step reports
 * by name.
 */
export function bjjEireCompetitionsSwitchedOnGiven(): () => void {
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
      switchedOn = expectSchema(featureFlagsSchema, await response.json()).BjjEireCompetitions;
    } finally {
      await flags.dispose();
    }
  });

  return () => {
    expect(switchedOn, FLAG_MISMATCH_MESSAGE).toBe(true);
  };
}
