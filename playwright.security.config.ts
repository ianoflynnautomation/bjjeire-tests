import { env } from './src/shared/config';
import { createBaseConfig } from './src/shared/config/playwright';

export default createBaseConfig({
  testDir: './tests/security',
  testIgnore: /.*\/(?:_setup|helpers|payloads)\/.*/,
  retries: 0,
  workers: 2,
  timeout: 60_000,
  globalSetup: require.resolve('./tests/security/_setup/staging-guard'),
  use: {
    baseURL: env.apiUrl,
    ignoreHTTPSErrors: env.acceptInvalidCerts,
  },
  projects: [
    {
      name: 'security',
      testMatch: /.*\.security\.spec\.ts$/,
    },
    {
      name: 'security-browser',
      testMatch: /.*\.security-browser\.spec\.ts$/,
      use: {
        baseURL: env.baseUrl,
      },
    },
  ],
});
