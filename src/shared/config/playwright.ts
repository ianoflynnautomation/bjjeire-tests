import { defineConfig, devices, type PlaywrightTestConfig, type Project } from '@playwright/test';
import { env } from './env';
import { readEnv } from './process-env';
import { TIMEOUTS } from './timeouts';

const IS_CI = env.isCI;

export const STORAGE_STATE_PATH = 'playwright/.auth/ui-user.json';

// Match setup files precisely so the UI setup project doesn't pick up the
// API setup file and vice-versa.
const UI_SETUP_TEST_MATCH = /.*\/auth\.setup\.ts$/;
const API_SETUP_TEST_MATCH = /.*\/auth\.api\.setup\.ts$/;

const WORKERS = { local: '50%', ci: '100%' } as const;
const MAX_FAILURES = 1;

const DESKTOP_VIEWPORT = { width: 1440, height: 900 };
const WIDE_VIEWPORT = { width: 1728, height: 1117 };

const UI_TEST_MATCH = /.*\.ui\.acceptance\.spec\.ts$/;

// Cloudflare Access service-token headers, sent on every request so the edge
// admits Playwright traffic before the in-cluster bearer token is enforced.
// Returns an empty record when the service token isn't configured (local /
// docker profiles where no CF Access sits in front of the origin).
function cloudflareAccessExtraHeaders(): Record<string, string> {
  const { clientId, clientSecret } = env.cfAccess;
  if (!clientId || !clientSecret) return {};
  return {
    'CF-Access-Client-Id': clientId,
    'CF-Access-Client-Secret': clientSecret,
  };
}
const SNAPSHOT_TEST_MATCH = /.*\.snapshot\.acceptance\.spec\.ts$/;
const API_TEST_MATCH = [
  /.*\.api\.acceptance\.spec\.ts$/,
  /.*\.api\.smoke\.spec\.ts$/,
  /.*consumer-contract.*\.spec\.ts$/,
];

const WIDE_TAGS_GREP = /@desktop|@smoke|@acceptance/;

const IGNORED_TAGS_GREP = readEnv('RUN_SLOW') === '1' ? /@bjj-events/ : /@bjj-events|@slow/;

const CUSTOM_LOGGER = './src/lib/reporters/custom-logger.ts';

const CI_REPORTERS: NonNullable<PlaywrightTestConfig['reporter']> = [
  ['blob'],
  ['github'],
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
    retries: IS_CI ? 1 : 0,
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
    reportSlowTests: { max: 10, threshold: 30_000 },
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
      video: 'retain-on-failure',
      actionTimeout: TIMEOUTS.action,
      navigationTimeout: TIMEOUTS.navigation,
      bypassCSP: true,
      serviceWorkers: 'block',
      colorScheme: 'light',
      extraHTTPHeaders: cloudflareAccessExtraHeaders(),
      contextOptions: {
        reducedMotion: 'reduce',
      },
      launchOptions: {
        args: ['--disable-dev-shm-usage'],
      },
    },
    captureGitInfo: { commit: true, diff: !IS_CI },
    ...overrides,
  });
}

export function createUiProjects(): Project[] {
  // Authenticated UI projects depend on the 'setup' project, which signs the
  // dev test user in via Entra and writes STORAGE_STATE_PATH. The setup project
  // is skipped at runtime when PW_TEST_USER / PW_TEST_PASSWORD are unset (local
  // profile against unauthenticated stack), so unauthenticated UI runs still
  // work without changes here.
  const authConfigured = !!env.uiTestUser.username && !!env.uiTestUser.password;
  const authDependencies = authConfigured ? ['setup'] : [];
  const uiUse = authConfigured ? ({ storageState: STORAGE_STATE_PATH } as const) : {};

  return [
    ...(authConfigured
      ? [
          {
            name: 'setup',
            testMatch: UI_SETUP_TEST_MATCH,
          },
        ]
      : []),
    {
      name: 'chromium-desktop',
      testMatch: UI_TEST_MATCH,
      dependencies: authDependencies,
      use: { ...devices['Desktop Chrome'], viewport: DESKTOP_VIEWPORT, ...uiUse },
    },
    {
      name: 'snapshots',
      testMatch: SNAPSHOT_TEST_MATCH,
      dependencies: authDependencies,
      use: { ...devices['Desktop Chrome'], viewport: DESKTOP_VIEWPORT, ...uiUse },
    },
    {
      name: 'firefox-desktop',
      testMatch: UI_TEST_MATCH,
      dependencies: authDependencies,
      use: { ...devices['Desktop Firefox'], viewport: DESKTOP_VIEWPORT, ...uiUse },
    },
    {
      name: 'webkit-desktop',
      testMatch: UI_TEST_MATCH,
      dependencies: authDependencies,
      use: { ...devices['Desktop Safari'], viewport: DESKTOP_VIEWPORT, ...uiUse },
    },
    {
      name: 'chromium-wide',
      testMatch: UI_TEST_MATCH,
      grep: WIDE_TAGS_GREP,
      dependencies: authDependencies,
      use: { ...devices['Desktop Chrome'], viewport: WIDE_VIEWPORT, ...uiUse },
    },
  ];
}

export function createApiProjects(): Project[] {
  // The api-setup project pre-warms the cross-worker token cache so api
  // workers read from disk instead of each hitting Entra independently.
  // Skipped on local profiles where AZURE_TESTS_CLIENT_SECRET is unset; in
  // that mode the request-context module also short-circuits the bearer
  // (auth: 'auto' falls through to no Authorization header).
  const apiAuthConfigured = !!env.azure.clientSecret;
  const apiSetupDeps = apiAuthConfigured ? ['api-setup'] : [];

  return [
    ...(apiAuthConfigured
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
