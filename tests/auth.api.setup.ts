import { expect, test as setup } from '@playwright/test';
import { warmApiAuthSetup } from '@api/setup/api-auth.setup';

const SETUP_TIMEOUT_MS = 30_000;

setup.describe('API auth setup', () => {
  setup('warm Entra token cache + verify CF Access headers', async () => {
    setup.setTimeout(SETUP_TIMEOUT_MS);
    await warmApiAuthSetup();
    expect.soft(true, 'API auth setup completed').toBe(true);
  });
});
