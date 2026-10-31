// Automatic oracles for an exploratory session. Run after every state worth judging:
//
//   npx playwright cli -s=<session> --raw run-code --filename=.agents/skills/exploratory-testing/scripts/oracles.js
//
// A single function expression, as `run-code` requires (no imports, no trailing semicolon).
// Returns one object; every array is a list of suspicions and `[]` means that oracle passed. The
// CLI resolves `node_modules/axe-core/axe.min.js` from the repo root it was started in.
// Console errors are not here: read them with `npx playwright cli -s=<session> console error`.
async page => {
  let axe;
  try {
    if (!(await page.evaluate(() => 'axe' in window))) {
      await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
    }
    axe = await page.evaluate(async () => {
      const result = await window.axe.run(document, {
        runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
      });
      return result.violations.map(v => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.length,
        first: v.nodes[0]?.target.join(' '),
      }));
    });
  } catch (error) {
    axe = [{ id: 'axe-unavailable', error: String(error) }];
  }

  const dom = await page.evaluate(() => {
    const describe = el => {
      const testId = el.closest('[data-testid]')?.getAttribute('data-testid');
      const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40);
      return `${el.tagName.toLowerCase()}${testId ? `[testid=${testId}]` : ''} "${text}"`;
    };
    const visible = el => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
    };

    // Layout: anything wider than the viewport means sideways scroll on a phone.
    const vw = document.documentElement.clientWidth;
    const overflow =
      document.documentElement.scrollWidth > vw + 1
        ? [...document.body.querySelectorAll('*')]
            .filter(el => visible(el) && el.getBoundingClientRect().right > vw + 1 && el.children.length === 0)
            .slice(0, 5)
            .map(el => `${describe(el)} right=${Math.round(el.getBoundingClientRect().right)} vw=${vw}`)
        : [];

    // Content: template or serialisation leaks the user can read.
    const leaks = [
      ...document.body.innerText.matchAll(/.{0,30}\b(undefined|NaN|Invalid Date|\[object Object\])\b.{0,30}/g),
    ]
      .slice(0, 5)
      .map(m => m[0].trim());

    const brokenImages = [...document.images]
      .filter(img => img.complete && img.naturalWidth === 0 && img.getAttribute('src'))
      .slice(0, 5)
      .map(img => img.getAttribute('src'));

    const deadLinks = [...document.querySelectorAll('a')]
      .filter(a => visible(a) && /^(#?|javascript:.*)$/i.test(a.getAttribute('href') ?? ''))
      .slice(0, 5)
      .map(describe);

    const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
    const duplicateIds = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))].slice(0, 5);

    // Network since the last full load (SPA navigation keeps accumulating entries).
    const api = performance
      .getEntriesByType('resource')
      .filter(e => (e.initiatorType === 'xmlhttprequest' || e.initiatorType === 'fetch') && /\/api\//.test(e.name));
    const failedApiCalls = api
      .filter(e => e.responseStatus === 0 || e.responseStatus >= 400)
      .map(e => `${e.responseStatus} ${e.name}`);
    const slowApiCalls = api.filter(e => e.duration > 2000).map(e => `${Math.round(e.duration)}ms ${e.name}`);
    const counts = api.reduce((acc, e) => acc.set(e.name, (acc.get(e.name) ?? 0) + 1), new Map());
    const repeatedApiCalls = [...counts].filter(([, n]) => n > 1).map(([url, n]) => `${n}x ${url}`);

    // List pages: the stated total, the cards and the empty state must agree.
    const listInvariant = [];
    const totalEl = document.querySelector('[data-testid$="-page-header-total"]');
    if (totalEl) {
      const stated = Number((totalEl.textContent ?? '').match(/\d+/)?.[0] ?? NaN);
      const cards = document.querySelectorAll('[data-testid$="-list-item"]').length;
      const empty = [...document.querySelectorAll('[data-testid="no-data-state"]')].some(visible);
      if (cards > stated) listInvariant.push(`${cards} cards shown but total says ${stated}`);
      if (empty && cards > 0) listInvariant.push(`empty state visible alongside ${cards} cards`);
      if (stated === 0 && !empty) listInvariant.push('total is 0 but no empty state');
      if (stated > 0 && cards === 0) listInvariant.push(`total says ${stated} but no cards (still loading?)`);
      if (stated > cards && cards > 0) listInvariant.push(`note: ${stated} total, ${cards} shown; check paging`);
    }

    return {
      overflow,
      leaks,
      brokenImages,
      deadLinks,
      duplicateIds,
      failedApiCalls,
      slowApiCalls,
      repeatedApiCalls,
      listInvariant,
    };
  });

  return { url: page.url(), viewport: page.viewportSize(), axe, ...dom };
}
