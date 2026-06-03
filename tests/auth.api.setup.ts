import { test as setup, expect } from '@playwright/test';
import { acquireApiAccessToken, cfAccessHeaders } from '@api/support/api';

// Cap the warm-up — Entra latency from EU regions is ~200-800ms; anything
// past 30s means a real outage. Failing fast is friendlier than a 60s default.
const SETUP_TIMEOUT_MS = 30_000;
const JWT_SHAPE_PATTERN = /^[\w-]+\.[\w-]+\.[\w-]+$/;

setup.describe('API auth setup', () => {
  setup('warm Entra token cache + verify CF Access headers', async () => {
    setup.setTimeout(SETUP_TIMEOUT_MS);

    // Forces acquisition and writes the cross-worker file cache before the API
    // suite fans out.
    const token = await acquireApiAccessToken();
    expect(token, 'Entra returned an empty access token').toMatch(JWT_SHAPE_PATTERN);

    // CF Access headers are env-derived, so this is a fast structural check.
    // We assert here rather than letting the first API test fail with a 403
    // from Cloudflare — saves debugging time on misconfigured envs.
    expect(
      Object.keys(cfAccessHeaders()),
      'CF_ACCESS_CLIENT_ID / CF_ACCESS_CLIENT_SECRET unset. Populate them in the active .env.<profile>.local before running API tests against a Cloudflare-protected environment.',
    ).toEqual(expect.arrayContaining(['CF-Access-Client-Id', 'CF-Access-Client-Secret']));
  });
});
