import { test } from '@ui/fixtures';
import { gotoAppShell } from '@ui/support';

/**
 * Starting point for the Playwright test agents. Running it through the core
 * fixtures signs in (storage state), pins the feature flags on and waits for
 * the app shell, so the agent's browser opens on the same app a spec sees.
 * Only the `agent-seed` project runs it, and only when `PW_AGENT_SEED` is set.
 */
test('seed', async ({ page, headerSection }) => {
  await gotoAppShell(page, '/about');
  await headerSection.expectVisible();
});
