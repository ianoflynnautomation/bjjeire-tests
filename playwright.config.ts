import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:60743';
const IS_CI = !!process.env.CI;
const startLocalHost = process.env.BASE_URL?.includes('localhost');

const ACTION_TIMEOUT = 10_000;
const NAVIGATION_TIMEOUT = 30_000;

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

  use: {
    headless: true,
    ignoreHTTPSErrors: true,
    acceptDownloads: true,
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
          // args: ['--disable-web-security'],
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
