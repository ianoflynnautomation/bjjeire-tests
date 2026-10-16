import type { PlaywrightTestOptions, PlaywrightWorkerOptions, Project } from '@playwright/test';
import { cfAccessHeaders, hasCfAccessCredentials } from '@shared/config/cf-access';
import { env } from '@shared/config/env';

const API_SETUP_TEST_MATCH = /.*\/auth\.api\.setup\.ts$/;
const API_TEST_MATCH = /.*\.api\.acceptance\.spec\.ts$/;

function hasEntraAuthBasics(): boolean {
  return !!env.azure.tenantId && !!env.azure.apiScope;
}

function shouldRunApiSetupProject(): boolean {
  return env.apiAuth.required || hasEntraAuthBasics() || env.cfAccess.required || hasCfAccessCredentials();
}

export function createApiProjects(): Project[] {
  const apiSetupRequired = shouldRunApiSetupProject();

  const use: NonNullable<Project<PlaywrightTestOptions, PlaywrightWorkerOptions>['use']> = {
    baseURL: env.apiUrl,
    ignoreHTTPSErrors: env.acceptInvalidCerts,
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
