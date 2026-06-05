import { devices, type Project } from '@playwright/test';
import { env } from '@shared/config/env';

export const STORAGE_STATE_PATH = 'playwright/.auth/ui-user.json';

const UI_SETUP_TEST_MATCH = /.*\/auth\.setup\.ts$/;
const UI_TEST_MATCH = /.*\.ui\.acceptance\.spec\.ts$/;
const SNAPSHOT_TEST_MATCH = /.*\.snapshot\.acceptance\.spec\.ts$/;
const WIDE_TAGS_GREP = /@desktop|@smoke|@acceptance/;

const DESKTOP_VIEWPORT = { width: 1440, height: 900 };
const WIDE_VIEWPORT = { width: 1728, height: 1117 };

export function createUiProjects(): Project[] {
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
