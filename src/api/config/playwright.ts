import type { Project } from '@playwright/test';
import { env } from '@shared/config/env';

const API_SETUP_TEST_MATCH = /.*\/auth\.api\.setup\.ts$/;
const API_TEST_MATCH = [
  /.*\.api\.acceptance\.spec\.ts$/,
  /.*\.api\.smoke\.spec\.ts$/,
  /.*consumer-contract.*\.spec\.ts$/,
];

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
  const apiSetupDeps = apiSetupRequired ? ['api-setup'] : [];

  return [
    ...(apiSetupRequired
      ? [
          {
            name: 'api-setup',
            testMatch: API_SETUP_TEST_MATCH,
          },
        ]
      : []),
    {
      name: 'api',
      testMatch: API_TEST_MATCH,
      dependencies: apiSetupDeps,
      use: {
        baseURL: env.apiUrl,
        ignoreHTTPSErrors: env.acceptInvalidCerts,
      },
    },
  ];
}
