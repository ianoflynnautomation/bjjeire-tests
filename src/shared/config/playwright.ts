import { defineConfig, devices, type PlaywrightTestConfig, type Project } from '@playwright/test';
import { env } from './env';
import { TIMEOUTS } from './timeouts';

const IS_CI = env.isCI;

const WORKERS = { local: '50%', ci: '100%' } as const;
const MAX_FAILURES = 1;

const DESKTOP_VIEWPORT = { width: 1440, height: 900 };
const WIDE_VIEWPORT = { width: 1728, height: 1117 };

const UI_TEST_MATCH = /.*\.ui\.acceptance\.spec\.ts$/;
const SNAPSHOT_TEST_MATCH = /.*\.snapshot\.acceptance\.spec\.ts$/;
const API_TEST_MATCH = [
  /.*\.api\.acceptance\.spec\.ts$/,
  /.*\.api\.smoke\.spec\.ts$/,
  /.*consumer-contract.*\.spec\.ts$/,
];

const WIDE_TAGS_GREP = /@desktop|@smoke|@acceptance/;
const IGNORED_TAGS_GREP = /@bjj-events/;

const CUSTOM_LOGGER = './src/lib/reporters/custom-logger.ts';

const CI_REPORTERS: NonNullable<PlaywrightTestConfig['reporter']> = [
  ['blob'],
  ['junit', { outputFile: 'test-results/junit.xml' }],
  [CUSTOM_LOGGER],
];

const LOCAL_REPORTERS: NonNullable<PlaywrightTestConfig['reporter']> = [
  ['list'],
  ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ['json', { outputFile: 'test-results/results.json' }],
  ['junit', { outputFile: 'test-results/junit.xml' }],
  ['allure-playwright', { resultsDir: 'allure-results' }],
  [CUSTOM_LOGGER],
];

export function createBaseConfig(overrides: PlaywrightTestConfig = {}): PlaywrightTestConfig {
  return defineConfig({
    testDir: './tests',
    testIgnore: /.*\/_template\/.*/,
    grepInvert: IGNORED_TAGS_GREP,
    fullyParallel: true,
    forbidOnly: IS_CI,
    retries: IS_CI ? 2 : 0,
    maxFailures: MAX_FAILURES,
    workers: IS_CI ? WORKERS.ci : WORKERS.local,
    timeout: TIMEOUTS.test,
    reporter: IS_CI ? CI_REPORTERS : LOCAL_REPORTERS,
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
    updateSnapshots: 'missing',
    use: {
      baseURL: env.baseUrl,
      headless: true,
      locale: 'en-IE',
      timezoneId: 'Europe/Dublin',
      viewport: DESKTOP_VIEWPORT,
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
      testMatch: UI_TEST_MATCH,
      use: { ...devices['Desktop Chrome'], viewport: DESKTOP_VIEWPORT },
    },
    {
      name: 'snapshots',
      testMatch: SNAPSHOT_TEST_MATCH,
      use: { ...devices['Desktop Chrome'], viewport: DESKTOP_VIEWPORT },
    },
    {
      name: 'firefox-desktop',
      testMatch: UI_TEST_MATCH,
      use: { ...devices['Desktop Firefox'], viewport: DESKTOP_VIEWPORT },
    },
    {
      name: 'webkit-desktop',
      testMatch: UI_TEST_MATCH,
      use: { ...devices['Desktop Safari'], viewport: DESKTOP_VIEWPORT },
    },
    {
      name: 'chromium-wide',
      testMatch: UI_TEST_MATCH,
      grep: WIDE_TAGS_GREP,
      use: { ...devices['Desktop Chrome'], viewport: WIDE_VIEWPORT },
    },
  ];
}

export function createApiProjects(): Project[] {
  return [
    {
      name: 'api',
      testMatch: API_TEST_MATCH,
      use: {
        baseURL: env.apiUrl,
        ignoreHTTPSErrors: env.acceptInvalidCerts,
      },
    },
  ];
}
