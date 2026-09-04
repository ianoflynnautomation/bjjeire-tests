import { expect, type Locator, type Page } from '@playwright/test';
import { env } from '@shared/config';
import { ENTRA_LOGIN_HOSTS, UI_AUTH_TIMEOUTS } from './microsoft.login.constants';
import { resolveCredentials, resolveUseEntra } from './microsoft.login.env';
import {
  acceptConsent,
  accountTile,
  emailInput,
  entraError,
  otherWaysToSignIn,
  passwordInput,
  permissionsPrompt,
  primaryButton,
  staySignedInNo,
  staySignedInPrompt,
  staySignedInYes,
  useAnotherAccount,
  useYourPassword,
} from './microsoft.login.locators';
import {
  hasUsableAuthState,
  isStorageStateFresh,
  storageStatePathForWorker,
  writeStorageStateAtomic,
} from './microsoft.login.session';
import { acquireUserTokens, applyMsalCacheInBrowser } from './microsoft.login.token';
import { type AuthenticateOptions, type Credentials, type ResolvedAuth } from './microsoft.login.types';

export type { AuthenticateOptions, Credentials } from './microsoft.login.types';
export { isStorageStateFresh, storageStatePathForWorker } from './microsoft.login.session';

export async function authenticateUiTestUser(
  page: Page,
  storageStatePath: string,
  options: AuthenticateOptions = {},
): Promise<void> {
  const resolved = resolveAuthContext(storageStatePath, options);
  if (resolved.useEntra) {
    if (await tryReuseStorageState(page, resolved)) return;
    if (await tryTokenBypass(page, resolved)) return;
  }
  await authenticateViaUi(page, resolved);
}

function resolveAuthContext(storageStatePath: string, options: AuthenticateOptions): ResolvedAuth {
  const useEntra = resolveUseEntra(options.useEntra);
  const workerIndex = options.workerIndex;
  const path = workerIndex === undefined ? storageStatePath : storageStatePathForWorker(storageStatePath, workerIndex);
  return {
    credentials: resolveCredentials(workerIndex),
    storageStatePath: path,
    useEntra,
    staySignedIn: useEntra,
  };
}

async function authenticateViaUi(page: Page, resolved: ResolvedAuth): Promise<void> {
  await page.goto(env.baseUrl);
  await waitForEntraLogin(page);
  await signIn(page, resolved.credentials, resolved.staySignedIn);
  await waitForReturnToOrigin(page);
  await persistAuthenticatedState(page, resolved.storageStatePath);
}

async function tryReuseStorageState(page: Page, resolved: ResolvedAuth): Promise<boolean> {
  if (!isStorageStateFresh(resolved.storageStatePath)) return false;
  await page.context().setStorageState(resolved.storageStatePath);
  await page.goto(env.baseUrl);
  if (await stillOnEntraLogin(page)) return false;
  await persistAuthenticatedState(page, resolved.storageStatePath);
  return true;
}

async function tryTokenBypass(page: Page, resolved: ResolvedAuth): Promise<boolean> {
  const tokens = await acquireUserTokens(resolved.credentials);
  if (!tokens) return false;
  await page.addInitScript(applyMsalCacheInBrowser, tokens.cache);
  await page.goto(env.baseUrl);
  if (await stillOnEntraLogin(page)) return false;
  await persistAuthenticatedState(page, resolved.storageStatePath);
  return true;
}

async function persistAuthenticatedState(page: Page, storageStatePath: string): Promise<void> {
  const storage = await page.context().storageState({ indexedDB: true });
  expect(hasUsableAuthState(storage), 'storage state should contain auth cookies or an injected MSAL cache').toBe(true);
  writeStorageStateAtomic(storageStatePath, storage);
}

async function signIn(page: Page, credentials: Credentials, staySignedIn: boolean): Promise<void> {
  await dismissAccountPicker(page, credentials.username);
  await submitEmailIfNeeded(page, credentials.username);
  await choosePasswordIfNeeded(page);
  await submitPasswordIfNeeded(page, credentials.password);
  await handleStaySignedIn(page, staySignedIn);
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

async function handleStaySignedIn(page: Page, staySignedIn: boolean): Promise<void> {
  if (!isEntraLoginUrl(page.url())) return;
  const appeared = await raceVisibleOrLeftEntra(page, staySignedInPrompt(page));
  if (!appeared) return;
  const choice = staySignedIn ? staySignedInYes(page) : staySignedInNo(page);
  await choice.click();
}

async function acceptConsentIfNeeded(page: Page): Promise<void> {
  if (!isEntraLoginUrl(page.url())) return;
  const appeared = await raceVisibleOrLeftEntra(page, permissionsPrompt(page));
  if (!appeared) return;
  await acceptConsent(page).click();
}

async function waitForEntraLogin(page: Page): Promise<void> {
  await expect(page).toHaveURL(entraUrlMatcher(), { timeout: UI_AUTH_TIMEOUTS.flow });
}

async function waitForReturnToOrigin(page: Page): Promise<void> {
  const originHost = new URL(env.baseUrl).hostname;
  await expect(page).toHaveURL(url => url.hostname === originHost && !isEntraLoginUrl(url.toString()), {
    timeout: UI_AUTH_TIMEOUTS.flow,
  });
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

function isEntraLoginUrl(url: string): boolean {
  let hostname: string;
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return ENTRA_LOGIN_HOSTS.some(host => url.includes(host));
  }
  return ENTRA_LOGIN_HOSTS.some(host => hostname === host || hostname.endsWith(`.${host}`));
}

function entraUrlMatcher(): RegExp {
  const hosts = ENTRA_LOGIN_HOSTS.map(host => host.replace(/\./g, '\\.')).join('|');
  return new RegExp(hosts);
}
