// Boot-path profile of the current route, measured the way a visitor gets it: cold cache,
// once on desktop and once on a throttled phone (Lighthouse "slow 4G", 4x CPU).
//
//   npx playwright cli -s=<session> --raw run-code --filename=.agents/skills/devtools/scripts/boot-profile.js
//
// Chromium only (it uses CDP). A single function expression, as `run-code` requires
// (no imports, no trailing semicolon). Reloads the page twice and leaves throttling off.
// The bootChain shows the path AGENTS.md describes:
// document → /featureflag + route chunk(s) in parallel → list API → content.
async page => {
  const PROFILES = {
    desktop: { latency: 0, downloadThroughput: -1, uploadThroughput: -1, cpu: 1 },
    slow4g: { latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8, cpu: 4 },
  };
  // Web Vitals "good" thresholds, plus a shell budget for this app's boot path.
  const BUDGETS = {
    desktop: { shellMs: 2000, contentMs: 3000, lcpMs: 2500, cls: 0.1, tbtMs: 200 },
    slow4g: { shellMs: 6000, contentMs: 8000, lcpMs: 4000, cls: 0.1, tbtMs: 600 },
  };
  const SHELL = '[data-testid="navigation"]';
  // A list page's heading paints before the list is fetched, so it does not count as content.
  const CONTENT = '[data-testid$="-list-item"], [data-testid="no-data-state"], [data-testid="about-page"]';
  // LCP (a late card image) and CLS keep moving after first content; read them once quiet.
  const VITALS_QUIET_MS = 2000;

  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Performance.enable');

  const measure = async name => {
    const p = PROFILES[name];
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: p.latency,
      downloadThroughput: p.downloadThroughput,
      uploadThroughput: p.uploadThroughput,
    });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: p.cpu });

    const started = Date.now();
    await page.reload({ waitUntil: 'commit' });
    await page.locator(SHELL).first().waitFor({ state: 'attached', timeout: 60_000 });
    const shellMs = Date.now() - started;
    await page.locator(CONTENT).first().waitFor({ state: 'visible', timeout: 60_000 });
    const contentMs = Date.now() - started;

    const inPage = await page.evaluate(async quietMs => {
      let lcp = null;
      let cls = 0;
      const longTasks = [];
      await new Promise(resolve => {
        const observers = [];
        let quiet;
        const restartQuietWindow = () => {
          clearTimeout(quiet);
          quiet = setTimeout(() => {
            observers.forEach(o => o.disconnect());
            resolve();
          }, quietMs);
        };
        const watch = (type, onEntries) => {
          try {
            const observer = new PerformanceObserver(list => {
              onEntries(list.getEntries());
              restartQuietWindow();
            });
            observer.observe({ type, buffered: true });
            observers.push(observer);
          } catch {
            // Entry type not supported; that metric stays at its default.
          }
        };
        watch('largest-contentful-paint', e => {
          lcp = e.at(-1)?.startTime ?? lcp;
        });
        watch('layout-shift', e => {
          cls += e.filter(s => !s.hadRecentInput).reduce((n, s) => n + s.value, 0);
        });
        watch('longtask', e => longTasks.push(...e.map(t => t.duration)));
        restartQuietWindow();
      });

      const nav = performance.getEntriesByType('navigation')[0];
      const res = performance.getEntriesByType('resource');
      const round = n => (n == null ? null : Math.round(n));
      const span = e => (e ? { start: round(e.startTime), end: round(e.responseEnd), ms: round(e.duration) } : null);
      const flags = res.find(e => /\/api\/v1\/featureflag/.test(e.name));
      const scripts = res.filter(e => e.initiatorType === 'script' || /\.m?js(\?|$)/.test(e.name));
      // The entry module and its static imports start while it is parsed; anything
      // starting after the entry module arrived was requested dynamically.
      const entryUrl = document.querySelector('script[type="module"][src]')?.src;
      const entry = scripts.find(e => e.name === entryUrl);
      const routeChunks = entry ? scripts.filter(e => e.startTime >= entry.responseEnd) : [];
      const lists = res.filter(e => /\/api\/v1\/(?!featureflag)[a-z]+(\?|$)/.test(e.name));
      const kb = n => Math.round(n / 1024);
      return {
        ttfbMs: round(nav?.responseStart),
        domContentLoadedMs: round(nav?.domContentLoadedEventEnd),
        lcpMs: round(lcp),
        cls: Math.round(cls * 1000) / 1000,
        tbtMs: round(longTasks.reduce((n, d) => n + Math.max(0, d - 50), 0)),
        longTasks: longTasks.length,
        bootChain: {
          document: span(nav),
          featureFlag: span(flags),
          routeChunks: routeChunks.map(e => ({ ...span(e), file: e.name.split('/').pop(), kb: kb(e.transferSize) })),
          listApi: lists.map(e => ({ ...span(e), url: e.name.replace(location.origin, '') })),
        },
        js: {
          files: scripts.length,
          transferKb: kb(scripts.reduce((n, e) => n + e.transferSize, 0)),
          largest: [...scripts]
            .sort((a, b) => b.transferSize - a.transferSize)
            .slice(0, 3)
            .map(e => `${e.name.split('/').pop()} ${kb(e.transferSize)}kB`),
        },
        requests: res.length,
      };
    }, VITALS_QUIET_MS);

    const { metrics } = await cdp.send('Performance.getMetrics');
    const metric = key => metrics.find(m => m.name === key)?.value ?? null;
    const runtime = {
      jsHeapMb: Math.round((metric('JSHeapUsedSize') ?? 0) / 1048576),
      domNodes: metric('Nodes'),
      layouts: metric('LayoutCount'),
      styleRecalcs: metric('RecalcStyleCount'),
      scriptMs: Math.round((metric('ScriptDuration') ?? 0) * 1000),
    };

    const budget = BUDGETS[name];
    const measured = { shellMs, contentMs, lcpMs: inPage.lcpMs, cls: inPage.cls, tbtMs: inPage.tbtMs };
    const overBudget = Object.entries(budget)
      .filter(([key, limit]) => measured[key] != null && measured[key] > limit)
      .map(([key, limit]) => `${key} ${measured[key]} > ${limit}`);
    return { shellMs, contentMs, overBudget, ...inPage, runtime };
  };

  try {
    const desktop = await measure('desktop');
    const slow4g = await measure('slow4g');
    return { url: page.url(), desktop, slow4g };
  } finally {
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1,
    });
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: false });
    await cdp.detach();
  }
}
