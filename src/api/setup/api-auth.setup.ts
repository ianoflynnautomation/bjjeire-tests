import { expect } from '@playwright/test';
import { acquireApiAccessToken } from '@api/support/api';
import { assertApiAuthEnvironment, shouldUseApiAuthorization } from '@api/support/auth';
import { cfAccessHeaders, env } from '@shared/config';

const JWT_SHAPE_PATTERN = /^[\w-]+\.[\w-]+\.[\w-]+$/;

export async function warmApiAuthSetup(): Promise<void> {
  assertApiAuthEnvironment();

  if (shouldUseApiAuthorization()) {
    const token = await acquireApiAccessToken();
    expect(token, 'Entra returned an empty access token').toMatch(JWT_SHAPE_PATTERN);
  }

  if (env.cfAccess.required) {
    expect(
      Object.keys(cfAccessHeaders()),
      'CF_ACCESS_CLIENT_ID / CF_ACCESS_CLIENT_SECRET unset. Populate them for Cloudflare-protected CI/AKS environments or set CF_ACCESS_REQUIRED=false for local-only runs.',
    ).toEqual(expect.arrayContaining(['CF-Access-Client-Id', 'CF-Access-Client-Secret']));
  }
}
