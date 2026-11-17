import { join } from 'node:path';

import { defineConfig, type PlaywrightTestConfig, type ReporterDescription } from '@playwright/test';
import { cfAccessHeaders } from './cf-access';
import { InvalidEnvVarError } from './config-errors';
import { env } from './env';
import type { FlagState } from './profile-defaults';
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

// Specs that need the environment's API to serve BJJ Éire competitions (`BjjEireCompetitions` flag on) carry this tag.
// Where the flag is off, or unknown, they are excluded, so a run there is not red by construction.
export const BJJEIRE_COMPETITIONS_ON_TAG = /@bjjeire-competitions-on/;

/** `@bjjeire-competitions-on` unless the environment's flag is known to be on. The runner says why. */
export function bjjEireCompetitionsFlagExclusions(flag: FlagState | undefined = env.bjjEireCompetitionsFlag): RegExp[] {
  if (flag === 'on') return [];
  // Workers load this config too; only the runner explains.
  if (process.env['TEST_WORKER_INDEX'] === undefined)
    process.stderr.write(
      `BJJEIRE_COMPETITIONS_FLAG is ${flag ?? `not set and APP_ENV=${env.profile} has no default`}: skipping @bjjeire-competitions-on specs. Set BJJEIRE_COMPETITIONS_FLAG=on when the environment runs with FEATURE_BJJEIRE_COMPETITIONS=true.\n`,
    );
  return [BJJEIRE_COMPETITIONS_ON_TAG];
}

// Specs that need the stack's local competitor sign-in (a token for any email) carry this tag. It is excluded
// wherever the environment has no such route, so a run on dev or staging is not red by construction.
export const LOCAL_SIGN_IN_TAG = /@local-sign-in/;

/** `@local-sign-in` when the environment has no local competitor sign-in. The runner says why. */
export function localSignInExclusions(flag: FlagState = env.localSignIn): RegExp[] {
  if (flag === 'on') return [];
  if (process.env['TEST_WORKER_INDEX'] === undefined)
    process.stderr.write(
      `LOCAL_SIGN_IN is off for APP_ENV=${env.profile}: skipping @local-sign-in specs. Set LOCAL_SIGN_IN=on when the stack runs the local profile with bjjeire.local-sign-in.enabled.\n`,
    );
  return [LOCAL_SIGN_IN_TAG];
}

/** Every exclusion that applies to every project. A project's own `grepInvert` replaces the config's, so it restates this. */
export const COMMON_GREP_INVERT: RegExp[] = [
  QUARANTINE_TAG,
  ...bjjEireCompetitionsFlagExclusions(),
  ...localSignInExclusions(),
];

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
    grepInvert: COMMON_GREP_INVERT,
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
