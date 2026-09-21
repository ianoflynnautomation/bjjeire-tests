import type { Project } from '@playwright/test';
import { cfAccessHeaders } from '@shared/config/cf-access';
import { env } from '@shared/config/env';

const API_SETUP_TEST_MATCH = /.*\/auth\.api\.setup\.ts$/;
const API_TEST_MATCH = /.*\.api\.acceptance\.spec\.ts$/;

function hasEntraAuthBasics(): boolean {
  return !!env.azure.tenantId && !!env.azure.apiScope;
}

function hasCloudflareAccessCredentials(): boolean {
  return !!env.cfAccess.clientId && !!env.cfAccess.clientSecret;
}

function shouldRunApiSetupProject(): boolean {
  return env.apiAuth.required || hasEntraAuthBasics() || env.cfAccess.required || hasCloudflareAccessCredentials();
}

export function createApiProjects(): Project[] {
  const apiSetupRequired = shouldRunApiSetupProject();

  // Shared so the setup project talks to the API too — inheriting the base
  // `use` would have pointed it at the UI origin.
  const use: NonNullable<Project['use']> = {
    baseURL: env.apiUrl,
    ignoreHTTPSErrors: env.acceptInvalidCerts,
    // Project `use` REPLACES the base value for this key, so the Cloudflare
    // Access headers from the base config have to be re-spread here.
    // Per-test headers (Entra bearer, traceparent) are layered in
    // `src/api/fixtures/index.ts`.
    extraHTTPHeaders: { accept: 'application/json', ...cfAccessHeaders() },
  };

  return [
    ...(apiSetupRequired ? [{ name: 'api-setup', testMatch: API_SETUP_TEST_MATCH, use }] : []),
    {
      name: 'api',
      testMatch: API_TEST_MATCH,
      dependencies: apiSetupRequired ? ['api-setup'] : [],
      use,
    },
  ];
}
