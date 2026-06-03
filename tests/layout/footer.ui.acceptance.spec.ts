import { expect } from '@playwright/test';
import { test } from '@ui/fixtures';
import * as Footer from '@ui/components/footer.component';
import { getPage, gotoURL } from '@ui/support/ui';

test.describe('Footer UI acceptance', { tag: ['@layout', '@footer', '@ui', '@desktop'] }, () => {
  for (const { name, path } of Footer.FOOTER_QUICK_LINKS) {
    test(`quick link "${name}" navigates to ${path}`, { tag: '@acceptance' }, async () => {
      await gotoURL(getPage(), '/');

      await Footer.expectVisible();
      await expect(Footer.quickLink(name)).toHaveAttribute('href', path);

      await Footer.clickQuickLink(name);
      await expect(getPage()).toHaveURL(new RegExp(`${path}(?:[/?#]|$)`));
    });
  }
});
