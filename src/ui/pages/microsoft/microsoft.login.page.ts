import { expect, type Page } from '@playwright/test';
import { env } from '@shared/config';
import { STORAGE_STATE_PATH } from '@ui/config/playwright';
import { type Credentials } from './microsoft.login.types';
import { ENTRA_LOGIN_HOST, UI_AUTH_TIMEOUTS } from './microsoft.login.constants';
import { getLocatorById, getLocatorByName, getLocatorByRole, getLocatorByTestId } from '@ui/support';
import { expectPageToContainURL, expectPageToHaveURL, expectPageToNotContainURL } from '@ui/support/navigation';

const emailInput = () => getLocatorByName('loginfmt');
const signInNextButton = () => getLocatorById('idSIButton9');
const otherWaysToSignInLabel = () => getLocatorByRole('button', { name: 'Other ways to sign in' });
const userPasswordButton = () => getLocatorByRole('button', { name: 'Use your password' });
const passwordInput = () => getLocatorByName('passwd');
const nextButton = () => getLocatorByTestId('primaryButton');
const staySignedInNoButton = () => getLocatorByTestId('secondaryButton');

export async function authenticateUiTestUser(page: Page): Promise<void> {
  const credentials = requireUiCredentials();

  await waitForEntraLogin();
  await signIn(credentials);
  await waitForReturnToOrigin();

  const storage = await page.context().storageState({ path: STORAGE_STATE_PATH });
  expect(storage.cookies.length, 'storage state should contain auth cookies').toBeGreaterThan(0);
}

async function signIn(credentials: Credentials): Promise<void> {
  await emailInput().fill(credentials.username);
  await signInNextButton().click();
  await otherWaysToSignInLabel().click();
  await userPasswordButton().click();
  await passwordInput().fill(credentials.password);
  await nextButton().click();
  await staySignedInNoButton().click();
}

function requireUiCredentials(): Credentials {
  const { username, password } = env.uiTestUser;
  if (!username || !password) {
    throw new Error('PW_TEST_USER and PW_TEST_PASSWORD must be set to run the auth setup project.');
  }
  return { username, password };
}

async function waitForEntraLogin(): Promise<void> {
  await expectPageToContainURL(ENTRA_LOGIN_HOST, {
    timeout: UI_AUTH_TIMEOUTS.flow,
  });
}

async function waitForReturnToOrigin(): Promise<void> {
  await expectPageToNotContainURL(ENTRA_LOGIN_HOST);
  await expectPageToHaveURL(env.baseUrl);
}
