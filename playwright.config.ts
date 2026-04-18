import { defineConfig, devices, type ReporterDescription } from '@playwright/test';
import { env } from './src/lib/config/env';
import { TIMEOUTS } from './src/lib/config/timeouts';

const IS_CI = env.isCI;

const ciReporters: ReporterDescription[] = [
  ['blob'],
  ['junit', { outputFile: 'test-results/junit.xml' }],
  ['./src/lib/reporters/custom-logger.ts'],
];

const localReporters: ReporterDescription[] = [
  ['list'],
  ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ['json', { outputFile: 'test-results/results.json' }],
  ['junit', { outputFile: 'test-results/junit.xml' }],
  ['allure-playwright', { resultsDir: 'allure-results' }],
  ['./src/lib/reporters/custom-logger.ts'],
];

export default defineConfig({
  testDir: './tests/features',
  fullyParallel: true,
  forbidOnly: IS_CI,
  retries: IS_CI ? 2 : 0,
  workers: IS_CI ? '100%' : undefined,
  timeout: TIMEOUTS.test,
  reporter: IS_CI ? ciReporters : localReporters,
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',

  expect: {
    timeout: TIMEOUTS.expect,
  },

  use: {
    headless: true,
    ignoreHTTPSErrors: env.acceptInvalidCerts,
    acceptDownloads: true,
    testIdAttribute: 'data-testid',
    baseURL: env.baseUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: IS_CI ? 'on-first-retry' : 'off',
    actionTimeout: TIMEOUTS.action,
    navigationTimeout: TIMEOUTS.navigation,
  },

  captureGitInfo: { commit: true, diff: true },

  projects: [
    {
      name: 'api',
      testMatch: /.*\.api\.spec\.ts$/,
      use: {
        baseURL: env.apiUrl,
        ignoreHTTPSErrors: env.acceptInvalidCerts,
      },
    },
    {
      name: 'ui-chromium',
      testMatch: /.*\.spec\.ts$/,
      testIgnore: /.*\.api\.spec\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1600, height: 1000 },
      },
    },
  ],
});
