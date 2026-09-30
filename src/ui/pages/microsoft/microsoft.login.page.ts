import { existsSync, mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { expect, type Locator, type Page } from '@playwright/test';
import { env } from '@shared/config';

export const UI_AUTH_TIMEOUTS = {
  flow: 60_000,
  /** Optional Entra screens (KMSI, consent) after a submit. */
  prompt: 15_000,
} as const;

const ENTRA_HOSTS = ['login.microsoftonline.com', 'login.microsoft.com', 'login.windows.net'] as const;

const emailInput = (page: Page): Locator =>
  page.getByRole('textbox', { name: /email|phone|skype/i }).or(page.locator('input[name="loginfmt"]'));

const passwordInput = (page: Page): Locator => page.getByLabel(/password/i).or(page.locator('input[name="passwd"]'));

const primaryButton = (page: Page): Locator =>
  page.getByRole('button', { name: /^(next|sign in)$/i }).or(page.locator('#idSIButton9'));

const otherWaysToSignIn = (page: Page): Locator => page.getByRole('button', { name: /other ways to sign in/i });

const useYourPassword = (page: Page): Locator => page.getByRole('button', { name: /use (your )?password/i });

const staySignedInPrompt = (page: Page): Locator => page.getByText(/stay signed in/i);

const staySignedInNo = (page: Page): Locator =>
  page.getByRole('button', { name: /^no$/i }).or(page.locator('#idBtn_Back'));

const useAnotherAccount = (page: Page): Locator => page.getByRole('button', { name: /use another account/i });

const accountTile = (page: Page, username: string): Locator => page.getByRole('button', { name: username });

const permissionsPrompt = (page: Page): Locator => page.getByText(/permissions requested/i);

const acceptConsent = (page: Page): Locator => page.getByRole('button', { name: /^accept$/i });

const entraError = (page: Page): Locator => page.getByRole('alert');

type Credentials = Readonly<{ username: string; password: string }>;

export async function authenticateUiTestUser(page: Page, storageStatePath: string): Promise<void> {
  const credentials = testUserCredentials();
  if (await tryReuseStorageState(page, storageStatePath)) return;

  await page.goto(env.baseUrl);
  await expect(page).toHaveURL(entraUrlMatcher(), { timeout: UI_AUTH_TIMEOUTS.flow });
  await signIn(page, credentials);
  await expect(page).toHaveURL(backOnApp, { timeout: UI_AUTH_TIMEOUTS.flow });
  await persistAuthenticatedState(page, storageStatePath);
}

function testUserCredentials(): Credentials {
  const { username, password } = env.uiTestUser;
  if (!username || !password) {
    throw new Error('PW_TEST_USER and PW_TEST_PASSWORD must be set to run the auth setup project.');
  }
  return { username, password };
}

async function tryReuseStorageState(page: Page, storageStatePath: string): Promise<boolean> {
  if (!existsSync(storageStatePath)) return false;
  try {
    await page.context().setStorageState(storageStatePath);
  } catch {
    return false;
  }
  await page.goto(env.baseUrl);
  if (await stillOnEntraLogin(page)) return false;
  await persistAuthenticatedState(page, storageStatePath);
  return true;
}

async function persistAuthenticatedState(page: Page, storageStatePath: string): Promise<void> {
  const storage = await page.context().storageState({ indexedDB: true });
  expect(storage.cookies.length, 'signed-in storage state should contain cookies').toBeGreaterThan(0);
  const tmpPath = `${storageStatePath}.${process.pid}.tmp`;
  mkdirSync(dirname(storageStatePath), { recursive: true });
  writeFileSync(tmpPath, JSON.stringify(storage, null, 2), { mode: 0o600 });
  renameSync(tmpPath, storageStatePath);
}

async function signIn(page: Page, credentials: Credentials): Promise<void> {
  await dismissAccountPicker(page, credentials.username);
  await submitEmailIfNeeded(page, credentials.username);
  await choosePasswordIfNeeded(page);
  await submitPasswordIfNeeded(page, credentials.password);
  await dismissStaySignedIn(page);
  await acceptConsentIfNeeded(page);
}

async function dismissAccountPicker(page: Page, username: string): Promise<void> {
  if (!isEntraLoginUrl(page.url())) return;
  await waitForFirstVisible(
    [
      accountTile(page, username),
      useAnotherAccount(page),
      emailInput(page),
      passwordInput(page),
      otherWaysToSignIn(page),
    ],
    UI_AUTH_TIMEOUTS.flow,
  );
  if (await isVisible(accountTile(page, username))) {
    await accountTile(page, username).click();
    return;
  }
  if (await isVisible(useAnotherAccount(page))) {
    await useAnotherAccount(page).click();
  }
}

async function submitEmailIfNeeded(page: Page, username: string): Promise<void> {
  if (!isEntraLoginUrl(page.url())) return;
  if (!(await isVisible(emailInput(page)))) return;
  await emailInput(page).fill(username);
  await primaryButton(page).click();
  await assertNoEntraError(page);
}

async function choosePasswordIfNeeded(page: Page): Promise<void> {
  if (!isEntraLoginUrl(page.url())) return;
  await waitForFirstVisible(
    [otherWaysToSignIn(page), useYourPassword(page), passwordInput(page), staySignedInPrompt(page)],
    UI_AUTH_TIMEOUTS.flow,
  );
  if (await isVisible(otherWaysToSignIn(page))) {
    await otherWaysToSignIn(page).click();
  }
  await waitForFirstVisible(
    [useYourPassword(page), passwordInput(page), staySignedInPrompt(page)],
    UI_AUTH_TIMEOUTS.prompt,
  );
  if (await isVisible(useYourPassword(page))) {
    await useYourPassword(page).click();
  }
}

async function submitPasswordIfNeeded(page: Page, password: string): Promise<void> {
  if (!isEntraLoginUrl(page.url())) return;
  if (await isVisible(staySignedInPrompt(page))) return;
  await expect(passwordInput(page)).toBeVisible({ timeout: UI_AUTH_TIMEOUTS.flow });
  await passwordInput(page).fill(password);
  await primaryButton(page).click();
  await assertNoEntraError(page);
}

async function dismissStaySignedIn(page: Page): Promise<void> {
  if (!isEntraLoginUrl(page.url())) return;
  if (!(await raceVisibleOrLeftEntra(page, staySignedInPrompt(page)))) return;
  await staySignedInNo(page).click();
}

async function acceptConsentIfNeeded(page: Page): Promise<void> {
  if (!isEntraLoginUrl(page.url())) return;
  if (!(await raceVisibleOrLeftEntra(page, permissionsPrompt(page)))) return;
  await acceptConsent(page).click();
}

async function stillOnEntraLogin(page: Page): Promise<boolean> {
  try {
    await page.waitForURL(url => !isEntraLoginUrl(url.toString()), { timeout: UI_AUTH_TIMEOUTS.prompt });
    return false;
  } catch {
    return isEntraLoginUrl(page.url());
  }
}

async function assertNoEntraError(page: Page): Promise<void> {
  const alert = entraError(page).first();
  if (!(await alert.isVisible())) return;
  const text = (await alert.innerText()).trim();
  if (text.length > 0) throw new Error(`Entra sign-in failed: ${text}`);
}

async function waitForFirstVisible(locators: Locator[], timeout: number): Promise<void> {
  const [first, ...rest] = locators;
  if (!first) return;
  const combined = rest.reduce((all, locator) => all.or(locator), first);
  await expect(combined.first()).toBeVisible({ timeout });
}

async function raceVisibleOrLeftEntra(page: Page, locator: Locator): Promise<boolean> {
  const timeout = UI_AUTH_TIMEOUTS.prompt;
  const appeared = locator
    .first()
    .waitFor({ state: 'visible', timeout })
    .then(() => true)
    .catch(() => false);
  const left = page
    .waitForURL(url => !isEntraLoginUrl(url.toString()), { timeout })
    .then(() => false)
    .catch(() => false);
  const won = await Promise.race([appeared, left]);
  const visible = await isVisible(locator);
  return won && visible;
}

function isVisible(locator: Locator): Promise<boolean> {
  return locator.first().isVisible();
}

function backOnApp(url: URL): boolean {
  return url.hostname === new URL(env.baseUrl).hostname && !isEntraLoginUrl(url.toString());
}

function isEntraLoginUrl(url: string): boolean {
  let hostname: string;
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return ENTRA_HOSTS.some(host => url.includes(host));
  }
  return ENTRA_HOSTS.some(host => hostname === host || hostname.endsWith(`.${host}`));
}

function entraUrlMatcher(): RegExp {
  return new RegExp(ENTRA_HOSTS.map(host => host.replace(/\./g, '\\.')).join('|'));
}
