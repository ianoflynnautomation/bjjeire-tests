// How much of each JS file the current route actually executes on load (V8 block coverage).
//
//   npx playwright cli -s=<session> --raw run-code --filename=.agents/skills/devtools/scripts/js-coverage.js
//
// Chromium only. Single function expression, no trailing semicolon. Reloads the page once.
// V8 ranges nest (a function, then the blocks inside it that did or did not run), so bytes
// are marked in order instead of summed. A large file with low use is a code-splitting
// candidate, which is an app finding.
async page => {
  await page.coverage.startJSCoverage({ resetOnNavigation: true });
  await page.reload();
  await page.locator('[data-testid="navigation"]').first().waitFor({ state: 'attached', timeout: 60_000 });
  await page.locator('[data-testid$="-list-item"], [data-testid="no-data-state"], main h1, main h2').first().waitFor();
  const entries = await page.coverage.stopJSCoverage();

  const latest = new Map(entries.filter(e => e.source).map(e => [e.url, e]));
  const files = [...latest.values()].map(e => {
    const ran = new Uint8Array(e.source.length);
    for (const fn of e.functions) for (const r of fn.ranges) ran.fill(r.count > 0 ? 1 : 0, r.startOffset, r.endOffset);
    const used = ran.reduce((n, b) => n + b, 0);
    return {
      file: e.url.replace(/^.*\//, ''),
      kb: Math.round(e.source.length / 1024),
      usedPct: Math.round((100 * used) / e.source.length),
      unusedKb: Math.round((e.source.length - used) / 1024),
    };
  });
  files.sort((a, b) => b.unusedKb - a.unusedKb);
  const total = files.reduce((n, f) => n + f.kb, 0);
  const unused = files.reduce((n, f) => n + f.unusedKb, 0);
  return { url: page.url(), totalKb: total, unusedKb: unused, files };
}
