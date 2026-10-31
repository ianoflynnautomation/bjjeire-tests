import { readEnv } from '@shared/config/process-env';
import { test } from '@ui/fixtures';
import { gotoAppShell } from '@ui/support';

/**
 * Starting point for the exploratory tester agent. Same state as `seed.spec.ts`
 * (signed in, feature flags pinned on, shell mounted), then it parks on
 * `page.pause()` so a `--debug=cli` run hands the agent a live page for as long
 * as the charter needs. `PW_EXPLORE_PATH` picks the first route (default `/`).
 * Only the `agent-seed` project runs it, and only when `PW_AGENT_SEED` is set.
 */
test('explore', async ({ page, headerSection }) => {
  test.setTimeout(0);
  await gotoAppShell(page, readEnv('PW_EXPLORE_PATH') ?? '/');
  await headerSection.expectVisible();
  // eslint-disable-next-line playwright/no-page-pause -- the pause is the hand-off to the agent
  await page.pause();
});
