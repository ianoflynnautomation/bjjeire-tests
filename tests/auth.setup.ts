import { test as setup, expect, type Locator, type Page } from '@playwright/test';
import { env } from '@shared/config';
import { STORAGE_STATE_PATH } from '@shared/config/playwright';

const TIMEOUTS = {
  // Generous overall budget: the user's first-time Entra interaction occasionally
  // adds a "stay signed in?" intermediate prompt and slow MFA-checks.
  flow: 60_000,
  // Single optional-step probe. Short enough to keep the suite snappy when an
  // optional prompt is absent; long enough to absorb 1-2 round trips.
  optionalStep: 5_000,
} as const;

const ENTRA_LOGIN_HOST = 'login.microsoftonline.com';

type Credentials = Readonly<{ username: string; password: string }>;

function requireUiCredentials(): Credentials {
  const { username, password } = env.uiTestUser;
  if (!username || !password) {
    throw new Error('PW_TEST_USER and PW_TEST_PASSWORD must be set to run the auth setup project.');
  }
  return { username, password };
}

/** Click a locator if it becomes visible within `optionalStep` budget; otherwise no-op. */
async function clickIfPresent(locator: Locator): Promise<boolean> {
  const visible = await locator
    .first()
    .isVisible({ timeout: TIMEOUTS.optionalStep })
    .catch(() => false);
  if (!visible) return false;
  await locator.first().click();
  return true;
}

async function triggerSignIn(page: Page): Promise<void> {
  await page.goto('/');
  // SPA may render an explicit Sign in button or auto-redirect on first paint —
  // either way is acceptable; we wait for the Entra URL transition below.
  await clickIfPresent(page.getByRole('button', { name: /sign in|log in/i }));
}

async function waitForEntraLogin(page: Page): Promise<void> {
  await page.waitForURL(new RegExp(ENTRA_LOGIN_HOST.replace(/\./g, '\\.')), { timeout: TIMEOUTS.flow });
}

async function submitCredentials(page: Page, { username, password }: Credentials): Promise<void> {
  await page.getByRole('textbox', { name: /email|user|sign in/i }).fill(username);
  await page.getByRole('button', { name: /next/i }).click();

  await page.getByRole('textbox', { name: /password/i }).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
}

async function dismissStaySignedInPrompt(page: Page): Promise<void> {
  // Declining keeps the session scoped to this test run — no persistent cookie
  // on the test user's account.
  await clickIfPresent(page.getByRole('button', { name: /^no$/i }));
}

async function waitForReturnToOrigin(page: Page): Promise<void> {
  await page.waitForURL(url => !url.toString().includes(ENTRA_LOGIN_HOST), { timeout: TIMEOUTS.flow });
  expect(page.url().startsWith(env.baseUrl), `Expected to land back on ${env.baseUrl} after sign-in`).toBe(true);
}

setup('authenticate UI test user via Entra', async ({ page }) => {
  const credentials = requireUiCredentials();
  setup.setTimeout(TIMEOUTS.flow);

  await triggerSignIn(page);
  await waitForEntraLogin(page);
  await submitCredentials(page, credentials);
  await dismissStaySignedInPrompt(page);
  await waitForReturnToOrigin(page);

  const storage = await page.context().storageState({ path: STORAGE_STATE_PATH });
  // Verifies the round-trip actually produced credentials. A successful Entra
  // sign-in always writes at least one cookie to the SPA's origin; absence
  // means the flow stalled silently somewhere upstream.
  expect(storage.cookies.length, 'storage state should contain auth cookies').toBeGreaterThan(0);
});
