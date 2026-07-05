import { join } from 'path';
import { defineConfig, type PlaywrightTestConfig } from '@playwright/test';
import { cfAccessHeaders } from './cf-access';
import { env } from './env';
import { TIMEOUTS } from './timeouts';

const REPO_ROOT = join(__dirname, '..', '..', '..');

const IS_CI = env.isCI;

const WORKERS = { local: '50%', ci: '100%' } as const;
// Locally we abort on first failure for tight feedback. CI runs the whole suite
// so every regression shows up in one report — fail-fast there hides 99% of the
// signal.
const MAX_FAILURES = IS_CI ? 0 : 1;

const DESKTOP_VIEWPORT = { width: 1440, height: 900 };

const CI_REPORTERS: NonNullable<PlaywrightTestConfig['reporter']> = [
  ['blob'],
  ['github'],
  ['junit', { outputFile: 'test-results/junit.xml' }],
];

const LOCAL_REPORTERS: NonNullable<PlaywrightTestConfig['reporter']> = [
  ['list'],
  ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ['json', { outputFile: 'test-results/results.json' }],
  ['junit', { outputFile: 'test-results/junit.xml' }],
  ['allure-playwright', { resultsDir: 'allure-results' }],
];

export function createBaseConfig(overrides: PlaywrightTestConfig = {}): PlaywrightTestConfig {
  return defineConfig({
    globalSetup: join(REPO_ROOT, 'global-setup.ts'),
    globalTeardown: join(REPO_ROOT, 'global-teardown.ts'),
    testDir: './tests',
    testIgnore: /.*\/_template\/.*/,
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
    // {platform} keeps per-OS screenshot baselines apart — a macOS-rendered PNG
    // never diffs cleanly against a Linux CI render.
    snapshotPathTemplate: '{testDir}/{testFileDir}/__screenshots__/{testFileName}/{arg}-{platform}{ext}',
    // 'missing' on CI would silently write and pass a brand-new baseline;
    // CI must only compare against committed ones.
    updateSnapshots: IS_CI ? 'none' : 'missing',
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
      colorScheme: 'dark',
      offline: false,
      extraHTTPHeaders: cfAccessHeaders(),
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
