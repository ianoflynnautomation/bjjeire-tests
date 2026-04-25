import { defineConfig, devices, type PlaywrightTestConfig, type Project } from '@playwright/test';
import { env } from './env';
import { TIMEOUTS } from './timeouts';

const IS_CI = env.isCI;

export const localWorkers = '50%';
export const ciWorkers = '100%';

export const ciReporters: NonNullable<PlaywrightTestConfig['reporter']> = [
  ['blob'],
  ['junit', { outputFile: 'test-results/junit.xml' }],
  ['./src/lib/reporters/custom-logger.ts'],
];

export const localReporters: NonNullable<PlaywrightTestConfig['reporter']> = [
  ['list'],
  ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ['json', { outputFile: 'test-results/results.json' }],
  ['junit', { outputFile: 'test-results/junit.xml' }],
  ['allure-playwright', { resultsDir: 'allure-results' }],
  ['./src/lib/reporters/custom-logger.ts'],
];

export function createBaseConfig(overrides: PlaywrightTestConfig = {}): PlaywrightTestConfig {
  return defineConfig({
    testDir: './tests/features',
    testIgnore: /.*\/_template\/.*/,
    fullyParallel: true,
    forbidOnly: IS_CI,
    retries: IS_CI ? 2 : 0,
    workers: IS_CI ? ciWorkers : localWorkers,
    timeout: TIMEOUTS.test,
    reporter: IS_CI ? ciReporters : localReporters,
    expect: {
      timeout: TIMEOUTS.expect,
      toHaveScreenshot: {
        animations: 'disabled',
        caret: 'hide',
        scale: 'css',
        maxDiffPixelRatio: 0.01,
        threshold: 0.2,
      },
      toMatchAriaSnapshot: {
        pathTemplate: '{testDir}/{testFileDir}/__aria__/{testFileName}/{arg}{ext}',
      },
    },
    snapshotPathTemplate: '{testDir}/{testFileDir}/__screenshots__/{testFileName}/{arg}{ext}',
    updateSnapshots: IS_CI ? 'missing' : 'missing',
    use: {
      baseURL: env.baseUrl,
      headless: true,
      locale: 'en-IE',
      timezoneId: 'Europe/Dublin',
      viewport: { width: 1440, height: 900 },
      ignoreHTTPSErrors: env.acceptInvalidCerts,
      acceptDownloads: true,
      testIdAttribute: 'data-testid',
      trace: 'on-first-retry',
      screenshot: 'only-on-failure',
      video: 'on-first-retry',
      actionTimeout: TIMEOUTS.action,
      navigationTimeout: TIMEOUTS.navigation,
    },
    captureGitInfo: { commit: true, diff: true },
    ...overrides,
  });
}

export function createUiProjects(): Project[] {
  return [
    {
      name: 'chromium-desktop',
      testMatch: /.*\.ui\.acceptance\.spec\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'snapshots',
      testMatch: /.*\.snapshot\.acceptance\.spec\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'firefox-desktop',
      testMatch: /.*\.ui\.acceptance\.spec\.ts$/,
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'webkit-desktop',
      testMatch: /.*\.ui\.acceptance\.spec\.ts$/,
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'chromium-wide',
      testMatch: /.*\.ui\.acceptance\.spec\.ts$/,
      grep: /@desktop|@smoke|@acceptance/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1728, height: 1117 },
      },
    },
  ];
}

export function createApiProjects(): Project[] {
  return [
    {
      name: 'api',
      testMatch: /.*\.api\.acceptance\.spec\.ts$/,
      use: {
        baseURL: env.apiUrl,
        ignoreHTTPSErrors: env.acceptInvalidCerts,
      },
    },
  ];
}
