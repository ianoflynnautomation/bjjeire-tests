import { test as setup } from '@playwright/test';
import { expectApiAuthReady } from '@api/support';

const SETUP_TIMEOUT_MS = 30_000;

setup.describe('API auth setup', () => {
  setup('warm Entra token cache + verify CF Access headers', async () => {
    setup.setTimeout(SETUP_TIMEOUT_MS);
    await expectApiAuthReady();
  });
});
