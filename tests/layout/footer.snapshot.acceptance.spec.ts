import { expect } from '@playwright/test';
import { test } from '@ui/fixtures';
import * as Footer from '@ui/components/footer.component';
import { getPage, gotoURL } from '@ui/support/ui';

test.describe('Footer snapshot acceptance', { tag: ['@layout', '@footer', '@snapshot', '@desktop'] }, () => {
  test('quick links ARIA snapshot', { tag: ['@snapshot', '@smoke'] }, async () => {
    await gotoURL(getPage(), '/about');

    await Footer.expectVisible();
    await expect(Footer.root()).toMatchAriaSnapshot({ name: 'quick-links.aria.yml' });
  });

  test('copyright ARIA snapshot', { tag: '@snapshot' }, async () => {
    await gotoURL(getPage(), '/about');

    await Footer.expectVisible();
    await expect(Footer.copyright()).toMatchAriaSnapshot({ name: 'copyright.aria.yml' });
  });
});
