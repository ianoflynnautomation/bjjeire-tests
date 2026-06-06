import { expect, test as setup } from '@playwright/test';
import { STORAGE_STATE_PATH } from '@ui/config/playwright';
import { UI_AUTH_TIMEOUTS } from '@ui/pages/microsoft/microsoft.login.constants';
import { authenticateUiTestUser } from '@ui/pages/microsoft/microsoft.login.page';

setup('authenticate UI test user via Entra', async ({ page }) => {
  setup.setTimeout(UI_AUTH_TIMEOUTS.flow);
  await authenticateUiTestUser(page, STORAGE_STATE_PATH);
  expect(true, 'UI auth setup completed').toBe(true);
});
