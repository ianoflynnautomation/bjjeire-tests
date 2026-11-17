import { z } from 'zod';
import { test, expect } from './fixtures';
import { API_ROUTES, apiAuthHeaders, expectSchema } from '@api/support';
import { env } from '@shared/config';
import { FLAG_MISMATCH_MESSAGE } from './flag-mismatch';

const featureFlagsSchema = z.object({ BjjEireCompetitions: z.boolean() });

/**
 * Call inside a `@bjjeire-competitions-on` UI describe. Pinning the browser flag is not enough: the API must serve
 * BJJ Éire competitions, so the environment's own flag endpoint is read once per worker (the UI project's base URL is
 * the site, so the API URL is absolute). Returns the Given step: BJJEIRE_COMPETITIONS_FLAG selects the set, so a
 * mismatch with the real flag is a misconfiguration the step reports by name.
 */
export function bjjEireCompetitionsSwitchedOnGiven(): () => void {
  let switchedOn: boolean | undefined;

  test.beforeAll(async ({ playwright }) => {
    const { ignoreHTTPSErrors, extraHTTPHeaders } = test.info().project.use;
    const flags = await playwright.request.newContext({
      ...(ignoreHTTPSErrors === undefined ? {} : { ignoreHTTPSErrors }),
      extraHTTPHeaders: { ...extraHTTPHeaders, ...(await apiAuthHeaders()) },
    });
    try {
      const response = await flags.get(`${env.apiUrl}${API_ROUTES.featureFlags}`);
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
