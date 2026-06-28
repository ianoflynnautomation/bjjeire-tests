import { expect, type Page } from '@playwright/test';
import { env } from '@shared/config';
import { type Credentials } from './microsoft.login.types';
import { ENTRA_LOGIN_HOST, UI_AUTH_TIMEOUTS } from './microsoft.login.constants';

const emailInput = (page: Page) => page.locator('[name="loginfmt"]');
const signInNextButton = (page: Page) => page.locator('#idSIButton9');
const otherWaysToSignInLabel = (page: Page) => page.getByRole('button', { name: 'Other ways to sign in' });
const userPasswordButton = (page: Page) => page.getByRole('button', { name: 'Use your password' });
const passwordInput = (page: Page) => page.locator('[name="passwd"]');
const nextButton = (page: Page) => page.getByTestId('primaryButton');
const staySignedInNoButton = (page: Page) => page.getByTestId('secondaryButton');

export async function authenticateUiTestUser(page: Page, storageStatePath: string): Promise<void> {
  const credentials = requireUiCredentials();

  await page.goto(env.baseUrl);
  await waitForEntraLogin(page);
  await signIn(page, credentials);
  await waitForReturnToOrigin(page);

  const storage = await page.context().storageState({ path: storageStatePath });
  expect(storage.cookies.length, 'storage state should contain auth cookies').toBeGreaterThan(0);
}

async function signIn(page: Page, credentials: Credentials): Promise<void> {
  await emailInput(page).fill(credentials.username);
  await signInNextButton(page).click();
  await otherWaysToSignInLabel(page).click();
  await userPasswordButton(page).click();
  await passwordInput(page).fill(credentials.password);
  await nextButton(page).click();
  await staySignedInNoButton(page).click();
}

function requireUiCredentials(): Credentials {
  const { username, password } = env.uiTestUser;
  if (!username || !password) {
    throw new Error('PW_TEST_USER and PW_TEST_PASSWORD must be set to run the auth setup project.');
  }
  return { username, password };
}

async function waitForEntraLogin(page: Page): Promise<void> {
  await expect(page).toHaveURL(new RegExp(ENTRA_LOGIN_HOST), { timeout: UI_AUTH_TIMEOUTS.flow });
}

async function waitForReturnToOrigin(page: Page): Promise<void> {
  await expect(page).not.toHaveURL(new RegExp(ENTRA_LOGIN_HOST));
  await expect(page).toHaveURL(env.baseUrl);
}
