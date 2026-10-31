// Memory and listener leak check across client-side navigation: clicks through every
// header nav link for several rounds (no reloads, so the SPA's heap persists), forces GC,
// and samples heap, DOM nodes and event listeners after each round.
//
//   npx playwright cli -s=<session> --raw run-code --filename=.agents/skills/devtools/scripts/leak-check.js
//
// Chromium only (CDP). Single function expression, no trailing semicolon. Growth that
// keeps climbing after round 1 (the warm-up) is a leak suspect. A one-off step is caching.
async page => {
  const ROUNDS = 5;
  const NAV = '[data-testid="navigation"]';
  const CONTENT = '[data-testid$="-list-item"], [data-testid="no-data-state"], main h1, main h2';

  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');
  await cdp.send('HeapProfiler.enable');

  const sample = async label => {
    await cdp.send('HeapProfiler.collectGarbage');
    const { metrics } = await cdp.send('Performance.getMetrics');
    const value = key => metrics.find(m => m.name === key)?.value ?? 0;
    return {
      label,
      jsHeapKb: Math.round(value('JSHeapUsedSize') / 1024),
      domNodes: value('Nodes'),
      listeners: value('JSEventListeners'),
      documents: value('Documents'),
    };
  };

  const links = await page.locator(`${NAV} a[href^="/"]`).evaluateAll(as => [
    ...new Set(as.map(a => a.getAttribute('href')).filter(h => h && h !== '/')),
  ]);
  const samples = [await sample('start')];
  for (let round = 1; round <= ROUNDS; round += 1) {
    for (const href of links) {
      await page.locator(`${NAV} a[href="${href}"]`).first().click();
      await page.locator(CONTENT).first().waitFor({ state: 'visible', timeout: 30_000 });
    }
    samples.push(await sample(`round ${round}`));
  }
  await cdp.detach();

  const afterWarmup = samples.slice(2);
  const growth = key => {
    const first = samples[1][key];
    const last = samples.at(-1)[key];
    const rising = afterWarmup.every((s, i) => i === 0 || s[key] >= afterWarmup[i - 1][key]);
    return { fromRound1: first, last, delta: last - first, risingEveryRound: rising };
  };
  const suspects = ['jsHeapKb', 'domNodes', 'listeners', 'documents'].filter(key => {
    const g = growth(key);
    return g.risingEveryRound && g.delta > Math.max(1, g.fromRound1 * 0.1);
  });
  return {
    routes: links,
    rounds: ROUNDS,
    samples,
    growth: Object.fromEntries(['jsHeapKb', 'domNodes', 'listeners', 'documents'].map(k => [k, growth(k)])),
    suspects,
  };
}
