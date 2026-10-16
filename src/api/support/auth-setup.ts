import { expect } from '@playwright/test';
import { env, hasCfAccessCredentials } from '@shared/config';
import { acquireEntraAccessToken, assertApiAuthEnvironment, shouldUseEntraAuthorization } from './auth';

const JWT_SHAPE_PATTERN = /^[\w-]+\.[\w-]+\.[\w-]+$/;

export async function expectApiAuthReady(): Promise<void> {
  assertApiAuthEnvironment();

  if (shouldUseEntraAuthorization()) {
    const token = await acquireEntraAccessToken();
    expect(token, 'Entra returned an empty access token').toMatch(JWT_SHAPE_PATTERN);
  }

  if (env.cfAccess.required || env.cfAccess.clientId || env.cfAccess.clientSecret) {
    expect(
      hasCfAccessCredentials(),
      'CF_ACCESS_CLIENT_ID / CF_ACCESS_CLIENT_SECRET unset. Populate them for Cloudflare-protected environments or set CF_ACCESS_REQUIRED=false for local-only runs.',
    ).toBe(true);
  }
}
