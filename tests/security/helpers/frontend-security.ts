import { expect, type Page } from '@playwright/test';

const SECRET_PATTERNS: readonly RegExp[] = [
  /AKIA[0-9A-Z]{16}/,
  /mongodb:\/\/\S+/i,
  /client_secret/i,
  /-----BEGIN.*PRIVATE KEY-----/i,
];

const SENSITIVE_STORAGE_KEY = /token|secret|password|credential/i;

/**
 * Returns the `href` of every `<a target="_blank">` that is missing `noopener`
 * or `noreferrer` in its `rel` attribute. An empty array is the pass case.
 */
export async function findUnsafeBlankLinks(page: Page): Promise<readonly string[]> {
  return page.evaluate(() => {
    const unsafe: string[] = [];
    document.querySelectorAll('a[target="_blank"]').forEach(link => {
      const rel = link.getAttribute('rel') ?? '';
      if (!rel.includes('noopener') || !rel.includes('noreferrer')) {
        unsafe.push(link.getAttribute('href') ?? 'unknown');
      }
    });
    return unsafe;
  });
}

export function expectNoSecretsInHtml(html: string): void {
  for (const pattern of SECRET_PATTERNS) {
    expect(html, `secret pattern ${pattern.source} appeared in HTML`).not.toMatch(pattern);
  }
}

export async function expectNoSensitiveLocalStorageKeys(page: Page): Promise<void> {
  const keys = await page.evaluate(() => Object.keys(localStorage));
  for (const key of keys) {
    expect(key, `localStorage key '${key}' looks sensitive`).not.toMatch(SENSITIVE_STORAGE_KEY);
  }
}

/**
 * Loads the current page inside an iframe and asserts that the app's `#root`
 * element does not render — confirming `X-Frame-Options: DENY` / CSP
 * `frame-ancestors 'none'` blocks framing.
 */
export async function expectFrameAncestorsDenied(page: Page): Promise<void> {
  const targetUrl = page.context().pages()[0]?.url() ?? '/';
  await page.setContent(`<iframe id="target" src="${targetUrl}" width="800" height="600"></iframe>`);

  const rootCount = await page
    .frameLocator('#target')
    .locator('#root')
    .count()
    .catch(() => 0);

  expect(rootCount, 'app loaded inside iframe — clickjacking protection missing').toBe(0);
}
