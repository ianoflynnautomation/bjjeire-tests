import { expect } from '@playwright/test';
import { test } from '@ui/fixtures';
import * as Header from '@ui/components/header.component';
import { getPage, gotoURL } from '@ui/support/ui';

test.describe('Header snapshot acceptance', { tag: ['@layout', '@header', '@snapshot', '@desktop'] }, () => {
  test('logo link ARIA snapshot', { tag: ['@snapshot', '@smoke'] }, async () => {
    await gotoURL(getPage(), '/about');

    await Header.expectVisible();
    await expect(Header.logoLink()).toMatchAriaSnapshot({ name: 'logo-link.aria.yml' });
  });
});
