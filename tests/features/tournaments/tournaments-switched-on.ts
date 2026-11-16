import { z } from 'zod';
import { test, expect } from '@api/fixtures';
import { API_ROUTES, apiAuthHeaders, expectSchema } from '@api/support';
import { env } from '@shared/config';

const featureFlagsSchema = z.object({ Tournaments: z.boolean() });

/**
 * Call inside a `@tournaments-on` describe. Reads the flag once per worker with the environment's own auth (only the
 * calls under test are anonymous) and returns the Given step: the tag split selects the set by TOURNAMENTS_FLAG, so a
 * mismatch with the real flag is a misconfiguration the step reports by name.
 */
export function tournamentsSwitchedOnGiven(): () => void {
  let tournamentsSwitchedOn: boolean;

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
      tournamentsSwitchedOn = expectSchema(featureFlagsSchema, await response.json()).Tournaments;
    } finally {
      await flags.dispose();
    }
  });

  return () => {
    expect(
      tournamentsSwitchedOn,
      `TOURNAMENTS_FLAG=${env.tournamentsFlag ?? 'unset'} selected the switched-on set but the environment's flag endpoint reports Tournaments: false`,
    ).toBe(true);
  };
}
