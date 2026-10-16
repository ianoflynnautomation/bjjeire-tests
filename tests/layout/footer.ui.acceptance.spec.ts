import { test, expect } from '@ui/fixtures';
import { FOOTER_QUICK_LINKS } from '@ui/pages/sections/footer.constants';
import { gotoAppShell } from '@ui/support';

test.describe('Footer UI acceptance', { tag: ['@layout', '@footer', '@ui', '@desktop'] }, () => {
  for (const { name, path } of FOOTER_QUICK_LINKS) {
    test(
      `Given the footer, when a visitor selects "${name}", then ${path} is opened`,
      { tag: '@acceptance' },
      async ({ page, footerSection }) => {
        await gotoAppShell(page, '/about');

        const quickLink = footerSection.quickLink(name);

        await footerSection.expectVisible();
        await expect(quickLink).toHaveAttribute('href', path);

        await quickLink.click();
        await expect(page).toHaveURL(new RegExp(`${path}(?:[/?#]|$)`));
      },
    );
  }
});
