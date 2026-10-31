import { expect, type Page } from '@playwright/test';
import { TIMEOUTS } from '@shared/config/timeouts';
import { HEADER_TEST_IDS } from '@ui/pages/sections/header.constants';

/**
 * Boot-path measurement for the `perf` project (`*.perf.acceptance.spec.ts`).
 * Same model as `.agents/skills/devtools/scripts/boot-profile.js`, in typed form:
 * throttle with CDP, open the route cold, time the shell and the first content,
 * then read LCP and CLS from the page. Chromium only.
 */
export type NetworkProfile = Readonly<{
  label: string;
  latencyMs: number;
  downloadBytesPerSecond: number;
  uploadBytesPerSecond: number;
  cpuSlowdown: number;
}>;

export const NETWORK_PROFILES = {
  desktop: {
    label: 'desktop broadband',
    latencyMs: 0,
    downloadBytesPerSecond: -1,
    uploadBytesPerSecond: -1,
    cpuSlowdown: 1,
  },
  slow4g: {
    label: 'a slow 4G phone',
    latencyMs: 150,
    downloadBytesPerSecond: 204_800, // 1.6 Mbit/s (Lighthouse slow 4G)
    uploadBytesPerSecond: 96_000, // 750 kbit/s
    cpuSlowdown: 4,
  },
} as const satisfies Record<string, NetworkProfile>;
export type NetworkProfileName = keyof typeof NETWORK_PROFILES;

export type BootMetrics = Readonly<{ shellMs: number; contentMs: number; lcpMs: number | null; cls: number }>;
export type BootBudget = Readonly<{ shellMs: number; contentMs: number; lcpMs: number; cls: number }>;

/** Web Vitals "good" thresholds for LCP and CLS, plus shell/content budgets for this app's boot chain. */
export const BOOT_BUDGETS = {
  desktop: { shellMs: 2_000, contentMs: 3_000, lcpMs: 2_500, cls: 0.1 },
  slow4g: { shellMs: 6_000, contentMs: 8_000, lcpMs: 4_000, cls: 0.1 },
} as const satisfies Record<NetworkProfileName, BootBudget>;

const CONTENT_SELECTOR = '[data-testid$="-list-item"], [data-testid="no-data-state"], main h1, main h2';
const OBSERVER_GRACE_MS = 1_500;

export async function measureBoot(page: Page, path: string, profile: NetworkProfile): Promise<BootMetrics> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: profile.latencyMs,
    downloadThroughput: profile.downloadBytesPerSecond,
    uploadThroughput: profile.uploadBytesPerSecond,
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: profile.cpuSlowdown });

  try {
    const started = Date.now();
    await page.goto(path, { waitUntil: 'commit' });
    await expect(page.getByTestId(HEADER_TEST_IDS.navigation)).toBeAttached({ timeout: TIMEOUTS.appBoot });
    const shellMs = Date.now() - started;
    await expect(page.locator(CONTENT_SELECTOR).first()).toBeVisible({ timeout: TIMEOUTS.appBoot });
    const contentMs = Date.now() - started;

    const vitals = await page.evaluate(async graceMs => {
      const observe = <T>(type: string, pick: (entries: PerformanceEntry[]) => T): Promise<T> =>
        new Promise(resolve => {
          const timer = setTimeout(() => {
            resolve(pick([]));
          }, graceMs);
          new PerformanceObserver((list, observer) => {
            clearTimeout(timer);
            observer.disconnect();
            resolve(pick(list.getEntries()));
          }).observe({ type, buffered: true });
        });
      type LayoutShift = PerformanceEntry & { value: number; hadRecentInput: boolean };
      const lcpMs = await observe('largest-contentful-paint', entries => entries.at(-1)?.startTime ?? null);
      const cls = await observe('layout-shift', entries =>
        (entries as LayoutShift[]).filter(e => !e.hadRecentInput).reduce((sum, e) => sum + e.value, 0),
      );
      return { lcpMs, cls };
    }, OBSERVER_GRACE_MS);

    return { shellMs, contentMs, lcpMs: vitals.lcpMs === null ? null : Math.round(vitals.lcpMs), cls: vitals.cls };
  } finally {
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    await cdp.detach();
  }
}

/** Soft-asserts every metric so one run reports all budget misses, not just the first. */
export function expectWithinBudget(metrics: BootMetrics, budget: BootBudget): void {
  expect.soft(metrics.shellMs, 'app shell (header) attached, ms').toBeLessThanOrEqual(budget.shellMs);
  expect.soft(metrics.contentMs, 'first content visible, ms').toBeLessThanOrEqual(budget.contentMs);
  if (metrics.lcpMs !== null) {
    expect.soft(metrics.lcpMs, 'largest contentful paint, ms').toBeLessThanOrEqual(budget.lcpMs);
  }
  expect.soft(metrics.cls, 'cumulative layout shift').toBeLessThanOrEqual(budget.cls);
}
