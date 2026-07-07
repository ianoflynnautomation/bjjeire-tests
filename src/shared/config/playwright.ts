import { join } from 'path';

import { defineConfig, type PlaywrightTestConfig, type ReporterDescription } from '@playwright/test';
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

export const QUARANTINE_TAG = /@quarantine/;

const CI_REPORTERS: ReporterDescription[] = [['blob'], ['github'], ['junit', { outputFile: 'test-results/junit.xml' }]];

const LOCAL_REPORTERS: ReporterDescription[] = [
  ['list'],
  ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ['json', { outputFile: 'test-results/results.json' }],
  ['junit', { outputFile: 'test-results/junit.xml' }],
  ['allure-playwright', { resultsDir: 'allure-results' }],
];

function activeReporters(): ReporterDescription[] {
  const base = IS_CI ? CI_REPORTERS : LOCAL_REPORTERS;
  if (!process.env['OTEL_EXPORTER_OTLP_ENDPOINT']) return base;
  return [...base, [join(REPO_ROOT, 'src', 'shared', 'otel', 'otel-reporter.ts')]];
}

export function createBaseConfig(overrides: PlaywrightTestConfig = {}): PlaywrightTestConfig {
  return defineConfig({
    testDir: './tests',
    testIgnore: /.*\/_template\/.*/,
    grepInvert: QUARANTINE_TAG,
    fullyParallel: true,
    forbidOnly: IS_CI,
    retries: IS_CI ? 1 : 0,
    maxFailures: MAX_FAILURES,
    workers: IS_CI ? WORKERS.ci : WORKERS.local,
    timeout: TIMEOUTS.test,
    reporter: activeReporters(),
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
    },
    captureGitInfo: { commit: true, diff: !IS_CI },
    ...overrides,
  });
}
