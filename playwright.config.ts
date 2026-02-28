import { defineConfig, devices } from '@playwright/test';
import { type WaitForLoadStateOptions } from './src/bjjeire-playwright/setup/optional-parameter-types';
import { EXPECT_TIMEOUT } from './src/bjjeire-playwright/constants/timeout-constants';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:60743';
const IS_CI = !!process.env.CI;
const startLocalHost = process.env.BASE_URL?.includes('localhost');

const ACTION_TIMEOUT = 10_000;
const NAVIGATION_TIMEOUT = 30_000;

export const LOADSTATE: WaitForLoadStateOptions = 'domcontentloaded';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: IS_CI,
  retries: IS_CI ? 2 : 0,
  workers: IS_CI ? '50%' : undefined,

  reporter: [
    ['dot'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['allure-playwright', { resultsDir: 'allure-results' }],
    ['./src/bjjeire-playwright/setup/custom-logger.ts'],
  ],
  globalSetup: require.resolve('./src/bjjeire-playwright/setup/global-setup.ts'),
  globalTeardown: require.resolve('./src/bjjeire-playwright/setup/global-teardown.ts'),
  expect: {
    timeout: EXPECT_TIMEOUT,
  },
  use: {
    headless: true,
    // extraHTTPHeaders: {
    //   'CF-Access-Client-Id': process.env.CF_CLIENT_ID || '',
    //   'CF-Access-Client-Secret': process.env.CF_CLIENT_SECRET || '',
    // },
    ignoreHTTPSErrors: true,
    acceptDownloads: true,
    testIdAttribute: 'test-id',
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: IS_CI ? 'on-first-retry' : 'off',

    actionTimeout: ACTION_TIMEOUT,
    navigationTimeout: NAVIGATION_TIMEOUT,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1600, height: 1000 },
        launchOptions: {
          // Remove --disable-web-security for production tests; use only for
          // local CORS-blocked environments.
          // args: ["--disable-web-security","--auto-open-devtools-for-tabs"],
          slowMo: 0,
        },
      },
    },

    // Uncomment to enable cross-browser coverage:
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit',  use: { ...devices['Desktop Safari']  } },

    // Mobile viewports:
    // { name: 'Mobile Chrome', use: { ...devices['Pixel 5']    } },
    // { name: 'Mobile Safari', use: { ...devices['iPhone 12']  } },

    // Branded channels:
    // { name: 'edge',   use: { ...devices['Desktop Edge'],   channel: 'msedge' } },
    // { name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
  ],

  ...(startLocalHost && {
    webServer: {
      command: 'cd ~/repos/ui && npm start ui-server',
      port: 9002,
      timeout: 60_000,
      reuseExistingServer: !IS_CI,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  }),
});
