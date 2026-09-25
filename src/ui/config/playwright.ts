import { devices, type Project } from '@playwright/test';
import { env } from '@shared/config/env';
import { DESKTOP_VIEWPORT, QUARANTINE_TAG } from '@shared/config/playwright';

export const STORAGE_STATE_PATH = 'playwright/.auth/ui-user.json';

const UI_SETUP_TEST_MATCH = /.*\/auth\.setup\.ts$/;
const UI_TEST_MATCH = /.*\.ui\.acceptance\.spec\.ts$/;
const SNAPSHOT_TEST_MATCH = /.*\.snapshot\.acceptance\.spec\.ts$/;
const A11Y_TEST_MATCH = /.*\.a11y\.acceptance\.spec\.ts$/;
const SMOKE_TAG = /@smoke/;
const WIDE_TAGS_GREP = /@layout|@wide/;
const MOBILE_TAGS_GREP = /@smoke|@mobile/;
const MOBILE_TAG = /@mobile/;
const THEME_TAG = /@theme/;

const WIDE_VIEWPORT = { width: 1728, height: 1117 };

const CHROMIUM_LAUNCH_OPTIONS = { args: ['--disable-dev-shm-usage'] };
const CHROMIUM_DESKTOP_DEVICE = { ...devices['Desktop Chrome'], launchOptions: CHROMIUM_LAUNCH_OPTIONS };
const CHROMIUM_GALAXY_DEVICE = { ...devices['Galaxy S24'], launchOptions: CHROMIUM_LAUNCH_OPTIONS };

type UiUse = NonNullable<Project['use']>;

/**
 * A project's `grepInvert` REPLACES the config-level one rather than adding to
 * it — verified by dropping `QUARANTINE_TAG` from one project, which promptly
 * ran a `@quarantine` test. So every project that filters has to restate the
 * quarantine exclusion, and this helper is the only way to write it.
 *
 * Projects with no `grepInvert` of their own (snapshots, a11y, mobile) inherit
 * the config-level filter and stay quarantine-free without it.
 */
function excluding(...tags: RegExp[]): RegExp[] {
  return [...tags, QUARANTINE_TAG];
}

type AuthContext = {
  readonly configured: boolean;
  readonly dependencies: string[];
  readonly use: UiUse;
};

function resolveAuthContext(): AuthContext {
  const reusePath = env.uiTestUser.storageStatePath;
  if (reusePath) {
    return { configured: false, dependencies: [], use: { storageState: reusePath } };
  }
  const configured = env.uiTestUser.entraEnabled && !!env.uiTestUser.username && !!env.uiTestUser.password;
  return {
    configured,
    dependencies: configured ? ['setup'] : [],
    use: configured ? { storageState: STORAGE_STATE_PATH } : {},
  };
}

function desktopUse(ctx: AuthContext, device: UiUse, overrides: UiUse = {}): UiUse {
  return { ...device, viewport: DESKTOP_VIEWPORT, ...overrides, ...ctx.use };
}

function mobileUse(ctx: AuthContext, device: UiUse): UiUse {
  return { ...device, ...ctx.use };
}

function desktopProjects(ctx: AuthContext): Project[] {
  return [
    {
      name: 'chromium-desktop',
      testMatch: UI_TEST_MATCH,
      grepInvert: excluding(MOBILE_TAG),
      dependencies: ctx.dependencies,
      use: desktopUse(ctx, CHROMIUM_DESKTOP_DEVICE),
    },
    {
      name: 'snapshots',
      testMatch: SNAPSHOT_TEST_MATCH,
      dependencies: ctx.dependencies,
      use: desktopUse(ctx, CHROMIUM_DESKTOP_DEVICE),
    },
    {
      name: 'a11y',
      testMatch: A11Y_TEST_MATCH,
      dependencies: ctx.dependencies,
      use: desktopUse(ctx, CHROMIUM_DESKTOP_DEVICE),
    },
    {
      name: 'firefox-desktop',
      testMatch: UI_TEST_MATCH,
      grep: SMOKE_TAG,
      grepInvert: excluding(MOBILE_TAG),
      dependencies: ctx.dependencies,
      use: desktopUse(ctx, devices['Desktop Firefox']),
    },
    {
      name: 'webkit-desktop',
      testMatch: UI_TEST_MATCH,
      grep: SMOKE_TAG,
      grepInvert: excluding(MOBILE_TAG),
      dependencies: ctx.dependencies,
      use: desktopUse(ctx, devices['Desktop Safari']),
    },
    {
      name: 'chromium-wide',
      testMatch: UI_TEST_MATCH,
      grep: WIDE_TAGS_GREP,
      grepInvert: excluding(MOBILE_TAG),
      dependencies: ctx.dependencies,
      use: desktopUse(ctx, CHROMIUM_DESKTOP_DEVICE, { viewport: WIDE_VIEWPORT }),
    },
  ];
}

function lightProjects(ctx: AuthContext): Project[] {
  return [
    {
      name: 'chromium-desktop-light',
      testMatch: UI_TEST_MATCH,
      grep: SMOKE_TAG,
      grepInvert: excluding(MOBILE_TAG, THEME_TAG),
      dependencies: ctx.dependencies,
      use: desktopUse(ctx, CHROMIUM_DESKTOP_DEVICE, { colorScheme: 'light' }),
    },
    {
      name: 'a11y-light',
      testMatch: A11Y_TEST_MATCH,
      dependencies: ctx.dependencies,
      use: desktopUse(ctx, CHROMIUM_DESKTOP_DEVICE, { colorScheme: 'light' }),
    },
  ];
}

function mobileProjects(ctx: AuthContext): Project[] {
  return [
    {
      name: 'mobile-iphone',
      testMatch: UI_TEST_MATCH,
      grep: MOBILE_TAGS_GREP,
      dependencies: ctx.dependencies,
      use: mobileUse(ctx, devices['iPhone 16']),
    },
    {
      name: 'mobile-galaxy',
      testMatch: UI_TEST_MATCH,
      grep: MOBILE_TAGS_GREP,
      dependencies: ctx.dependencies,
      use: mobileUse(ctx, CHROMIUM_GALAXY_DEVICE),
    },
  ];
}

export function createUiProjects(): Project[] {
  const ctx = resolveAuthContext();
  const setup: Project[] = ctx.configured ? [{ name: 'setup', testMatch: UI_SETUP_TEST_MATCH }] : [];
  return [...setup, ...desktopProjects(ctx), ...lightProjects(ctx), ...mobileProjects(ctx)];
}
