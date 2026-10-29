import { join } from 'node:path';

import { defineConfig, type PlaywrightTestConfig, type ReporterDescription } from '@playwright/test';
import { cfAccessHeaders } from './cf-access';
import { InvalidEnvVarError } from './config-errors';
import { env } from './env';
import { readEnv } from './process-env';
import { resolveRunId } from './run-id';
import { TIMEOUTS } from './timeouts';

resolveRunId();

const OTEL_REPORTER = join(__dirname, '..', 'otel', 'otel-reporter.ts');
const SQUASH_REPORTER = '@playwright-squash/playwright-squash/results';
const IS_CI = env.isCI;
const WORKERS = { local: '50%', ci: 4 } as const;
const MAX_FAILURES = IS_CI ? 0 : 1;

export const DESKTOP_VIEWPORT = { width: 1440, height: 900 };

export const QUARANTINE_TAG = /@quarantine/;

function resolveWorkers(): number | string {
  const override = readEnv('PLAYWRIGHT_WORKERS');
  if (!override) return IS_CI ? WORKERS.ci : WORKERS.local;
  if (override.endsWith('%')) return override;
  const parsed = Number(override);
  if (Number.isInteger(parsed) && parsed > 0) return parsed;
  throw new InvalidEnvVarError('PLAYWRIGHT_WORKERS', override, 'a positive integer or a percentage such as 50%');
}

const CI_REPORTERS: ReporterDescription[] = [['blob'], ['github'], ['junit', { outputFile: 'test-results/junit.xml' }]];

const LOCAL_REPORTERS: ReporterDescription[] = [
  ['list'],
  ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ['json', { outputFile: 'test-results/results.json' }],
  ['junit', { outputFile: 'test-results/junit.xml' }],
];

function activeReporters(): ReporterDescription[] {
  const reporters: ReporterDescription[] = IS_CI ? [...CI_REPORTERS] : [...LOCAL_REPORTERS];
  if (!IS_CI && readEnv('ALLURE')) {
    reporters.push(['allure-playwright', { resultsDir: 'allure-results' }]);
  }
  if (readEnv('OTEL_EXPORTER_OTLP_ENDPOINT')) {
    reporters.push([OTEL_REPORTER]);
  }
  // Opt-in: an explicit mode, or a run started through `npm run squash:run`.
  if (readEnv('SQUASH_TM_MODE') ?? readEnv('SQUASH_TM_RUNNER')) {
    reporters.push([SQUASH_REPORTER]);
  }
  return reporters;
}

const BASE_USE: NonNullable<PlaywrightTestConfig['use']> = {
  baseURL: env.baseUrl,
  storageState: undefined,
  colorScheme: 'dark',
  geolocation: undefined,
  locale: 'en-IE',
  permissions: undefined,
  timezoneId: 'Europe/Dublin',
  viewport: DESKTOP_VIEWPORT,
  acceptDownloads: true,
  extraHTTPHeaders: cfAccessHeaders(),
  httpCredentials: undefined,
  ignoreHTTPSErrors: env.acceptInvalidCerts,
  offline: false,
  proxy: undefined,
  screenshot: 'only-on-failure',
  trace: 'on-first-retry',
  video: 'retain-on-failure',
  actionTimeout: TIMEOUTS.action,
  bypassCSP: true,
  channel: undefined,
  headless: true,
  testIdAttribute: 'data-testid',
  userAgent: undefined,
  navigationTimeout: TIMEOUTS.navigation,
  serviceWorkers: 'block',
  contextOptions: {
    reducedMotion: 'reduce',
  },
};

export function createBaseConfig(overrides: PlaywrightTestConfig = {}): PlaywrightTestConfig {
  const { use, ...rest } = overrides;
  return defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: IS_CI,
    retries: IS_CI ? 1 : 0,
    workers: resolveWorkers(),
    reporter: activeReporters(),
    testIgnore: /.*\/_template\/.*/,
    grepInvert: QUARANTINE_TAG,
    maxFailures: MAX_FAILURES,
    timeout: TIMEOUTS.test,
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
    snapshotPathTemplate: '{testDir}/{testFileDir}/__screenshots__/{testFileName}/{arg}-{platform}{ext}',
    updateSnapshots: IS_CI ? 'none' : 'missing',
    reportSlowTests: { max: 10, threshold: 30_000 },
    use: { ...BASE_USE, ...use },
    captureGitInfo: { commit: true, diff: !IS_CI },
    ...rest,
  });
}
