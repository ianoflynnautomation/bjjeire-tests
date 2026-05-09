import { expect, test } from '@playwright/test';
import {
  expectFrameAncestorsDenied,
  expectNoSecretsInHtml,
  expectNoSensitiveLocalStorageKeys,
  findUnsafeBlankLinks,
} from './helpers/frontend-security';

test.describe('Frontend security — browser context', { tag: ['@security', '@regression', '@frontend'] }, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('all target="_blank" links have rel="noopener noreferrer"', async ({ page }) => {
    const unsafeLinks = await findUnsafeBlankLinks(page);
    expect(unsafeLinks, `Links missing noopener/noreferrer: ${unsafeLinks.join(', ')}`).toHaveLength(0);
  });

  test('page does not expose API keys or secrets in HTML', async ({ page }) => {
    expectNoSecretsInHtml(await page.content());
  });

  test('localStorage does not contain tokens or secrets', async ({ page }) => {
    await expectNoSensitiveLocalStorageKeys(page);
  });

  test('frontend serves security headers through Cloudflare', async ({ page }) => {
    const response = await page.goto('/');
    expect(response, 'navigation returned no response').not.toBeNull();
    const headers = response?.headers() ?? {};
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['strict-transport-security']).toBeDefined();
  });

  test('page cannot be loaded in an iframe', async ({ page }) => {
    await expectFrameAncestorsDenied(page);
  });
});
