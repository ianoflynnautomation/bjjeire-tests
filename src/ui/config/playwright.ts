import { devices, type Project } from '@playwright/test';
import { env } from '@shared/config/env';
import { QUARANTINE_TAG } from '@shared/config/playwright';

export const STORAGE_STATE_PATH = 'playwright/.auth/ui-user.json';

const UI_SETUP_TEST_MATCH = /.*\/auth\.setup\.ts$/;
const UI_TEST_MATCH = /.*\.ui\.acceptance\.spec\.ts$/;
const SNAPSHOT_TEST_MATCH = /.*\.snapshot\.acceptance\.spec\.ts$/;
const A11Y_TEST_MATCH = /.*\.a11y\.acceptance\.spec\.ts$/;
const WIDE_TAGS_GREP = /@desktop|@smoke|@acceptance/;
const MOBILE_TAGS_GREP = /@smoke|@mobile/;
const MOBILE_TAG = /@mobile/;

const DESKTOP_VIEWPORT = { width: 1440, height: 900 };
const WIDE_VIEWPORT = { width: 1728, height: 1117 };

const CHROMIUM_LAUNCH_OPTIONS = { args: ['--disable-dev-shm-usage'] };
const CHROMIUM_DESKTOP_DEVICE = { ...devices['Desktop Chrome'], launchOptions: CHROMIUM_LAUNCH_OPTIONS };
const CHROMIUM_GALAXY_DEVICE = { ...devices['Galaxy S24'], launchOptions: CHROMIUM_LAUNCH_OPTIONS };

export function createUiProjects(): Project[] {
  const authConfigured = env.uiTestUser.entraEnabled && !!env.uiTestUser.username && !!env.uiTestUser.password;
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
      grepInvert: [MOBILE_TAG, QUARANTINE_TAG],
      dependencies: authDependencies,
      use: { ...CHROMIUM_DESKTOP_DEVICE, viewport: DESKTOP_VIEWPORT, ...uiUse },
    },
    {
      name: 'snapshots',
      testMatch: SNAPSHOT_TEST_MATCH,
      dependencies: authDependencies,
      use: { ...CHROMIUM_DESKTOP_DEVICE, viewport: DESKTOP_VIEWPORT, ...uiUse },
    },
    {
      name: 'a11y',
      testMatch: A11Y_TEST_MATCH,
      dependencies: authDependencies,
      use: { ...CHROMIUM_DESKTOP_DEVICE, viewport: DESKTOP_VIEWPORT, ...uiUse },
    },
    {
      name: 'firefox-desktop',
      testMatch: UI_TEST_MATCH,
      grepInvert: [MOBILE_TAG, QUARANTINE_TAG],
      dependencies: authDependencies,
      use: { ...devices['Desktop Firefox'], viewport: DESKTOP_VIEWPORT, ...uiUse },
    },
    {
      name: 'webkit-desktop',
      testMatch: UI_TEST_MATCH,
      grepInvert: [MOBILE_TAG, QUARANTINE_TAG],
      dependencies: authDependencies,
      use: { ...devices['Desktop Safari'], viewport: DESKTOP_VIEWPORT, ...uiUse },
    },
    {
      name: 'chromium-wide',
      testMatch: UI_TEST_MATCH,
      grep: WIDE_TAGS_GREP,
      grepInvert: [MOBILE_TAG, QUARANTINE_TAG],
      dependencies: authDependencies,
      use: { ...CHROMIUM_DESKTOP_DEVICE, viewport: WIDE_VIEWPORT, ...uiUse },
    },
    {
      name: 'mobile-iphone',
      testMatch: UI_TEST_MATCH,
      grep: MOBILE_TAGS_GREP,
      dependencies: authDependencies,
      use: { ...devices['iPhone 16'], ...uiUse },
    },
    {
      name: 'mobile-galaxy',
      testMatch: UI_TEST_MATCH,
      grep: MOBILE_TAGS_GREP,
      dependencies: authDependencies,
      use: { ...CHROMIUM_GALAXY_DEVICE, ...uiUse },
    },
  ];
}
