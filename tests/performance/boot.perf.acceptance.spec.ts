import { test } from '@ui/fixtures';
import { HEADER_NAV_LINKS } from '@ui/pages/sections/header.constants';
import {
  BOOT_BUDGETS,
  NETWORK_PROFILES,
  expectWithinBudget,
  measureBoot,
  type NetworkProfileName,
} from '@ui/support/performance';

/**
 * Boot budgets per route, cold cache, desktop and slow-4G phone. Opt-in: the `perf`
 * project exists only with PW_PERF=true (`npm run test:perf`) and runs on one worker,
 * because timings taken under parallel load measure the machine, not the app.
 * Docker numbers are lower bounds for AKS (no TLS, edge or real network).
 */
const PROFILES: readonly NetworkProfileName[] = ['desktop', 'slow4g'];

test.describe('Boot performance', { tag: ['@perf', '@ui', '@desktop'] }, () => {
  for (const { name, path } of HEADER_NAV_LINKS) {
    for (const profileName of PROFILES) {
      const profile = NETWORK_PROFILES[profileName];

      test(
        `visitor should see ${name} load within budget on ${profile.label}`,
        { tag: '@acceptance' },
        async ({ page }) => {
          const metrics = await test.step(`When a visitor on ${profile.label} opens ${name} with a cold cache`, () =>
            measureBoot(page, path, profile));

          await test.step('Then the shell, first content, LCP and layout shift are within budget', () => {
            test.info().annotations.push({ type: 'boot-metrics', description: JSON.stringify(metrics) });
            expectWithinBudget(metrics, BOOT_BUDGETS[profileName]);
          });
        },
      );
    }
  }
});
