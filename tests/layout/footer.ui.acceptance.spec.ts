import { test, expect } from '@ui/fixtures';
import { FOOTER_QUICK_LINKS } from '@ui/pages/sections/footer.constants';
import { gotoAppShell } from '@ui/support';
import { squash } from '@squash/annotations';

test.describe('Footer UI acceptance', { tag: ['@layout', '@footer', '@ui', '@desktop', '@squash'] }, () => {
  for (const { name, path } of FOOTER_QUICK_LINKS) {
    test(
      `visitor should open ${path} by selecting "${name}" in the footer`,
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
      },
      async ({ page, footerSection }) => {
        await test.step('When a visitor opens the About page', async () => {
          await gotoAppShell(page, '/about');
        });

        const quickLink = footerSection.quickLink(name);

        await test.step(`Then the footer offers "${name}" linking to ${path}`, async () => {
          await footerSection.expectVisible();
          await expect(quickLink).toHaveAttribute('href', path);
        });

        await test.step(`When the visitor selects "${name}"`, async () => {
          await quickLink.click();
        });

        await test.step(`Then ${path} opens`, async () => {
          await expect(page).toHaveURL(new RegExp(`${path}(?:[/?#]|$)`));
        });
      },
    );
  }
});
