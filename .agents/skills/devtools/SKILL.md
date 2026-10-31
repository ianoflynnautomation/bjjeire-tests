---
name: devtools
description: Chrome DevTools-level diagnosis of the BjjEire app through the pinned Playwright CLI and CDP. Covers boot-path performance (document → feature flags → route chunk → list API), Web Vitals (LCP, CLS, TBT), network and CPU throttling, JS weight, runtime metrics, memory and listener leaks across client-side navigation, and request, console and coverage inspection. Use when a test is slow or times out on a cold or throttled environment, a charter is about performance or mobile networks, someone asks why a page is slow or janky, or a heal hinges on what the page did over time. Chromium only. Do not use for locators (selectors skill) or backend spans (trace-correlation skill).
metadata:
  author: Ian O Flynn
---

# DevTools for this suite

Everything here runs inside an `npx playwright cli` session, so it works in the
healer's `--debug=cli` session, the explorer's `explore.spec.ts` session, or a plain
`open`. Start a session the way the agent files describe, then use the scripts below with
`run-code --filename`. Each script is a bare function expression and needs Chromium,
because it uses CDP via `page.context().newCDPSession(page)`.

## 1. Boot-path profile

```sh
npx playwright cli -s=<session> --raw run-code --filename=.agents/skills/devtools/scripts/boot-profile.js
```

This reloads the current route twice with the cache disabled: once on desktop, and once
on a slow-4G phone (150 ms RTT, 1.6 Mbps, 4x CPU). For each profile it returns:

- `shellMs` / `contentMs`: reload until the header nav is attached / until the first
  card, empty state or heading is visible. This is what `gotoRoute` waits for, measured.
- `bootChain`: start/end (ms from navigation) of the document, `/featureflag`, the
  route chunks (JS that starts after flags resolve) and the list API call. Gaps
  between links are serial waiting the visitor sees.
- `lcpMs`, `cls`, `tbtMs`, `longTasks`, JS file count and transfer size (largest three),
  and CDP runtime metrics (heap, DOM nodes, layouts, style recalcs, script time).
- `overBudget`: anything over `BUDGETS` in the script. These are Web Vitals "good"
  thresholds plus a shell budget for this app.

**Reading it.** The app cannot render before MSAL init and the flag fetch, and the route
chunk cannot load before the first render, so the chain is serial by design. Look for:

- A long gap between `featureFlag.end` and the first route chunk: render blocked on
  MSAL or something else after flags.
- A gap between the last route chunk and `listApi.start`: the page waits before it
  fetches. On 2026-10-30 (Docker, desktop, `/events`) this gap was ~300 ms.
- `contentMs` well after `listApi.end`: rendering or an entrance animation delays
  content. That day it was ~500 ms, with desktop CLS 0.296 (over 0.1).
- `cls` over 0.1: cards or filters shifting as data lands. A skeleton or reserved
  height fixes it in the app.

Re-run once before you trust a number. The first run after a stack restart is cold
server-side. Docker numbers are lower bounds, because AKS adds network, TLS and the
Cloudflare edge.

**As a regression gate.** `npm run test:perf` (`tests/performance/`, opt-in `perf`
project) asserts the same shell, content, LCP and CLS budgets per route. Use this script
to explain a miss, and the test to catch one.

**Turning it into a test timeout story.** If `slow4g.shellMs` approaches
`TIMEOUTS.appBoot`, a cold CI environment will time out in `gotoRoute`. That is an
environment or app finding. Raising the timeout hides it.

## 2. Leak check

```sh
npx playwright cli -s=<session> --raw run-code --filename=.agents/skills/devtools/scripts/leak-check.js
```

This clicks through every header nav link for 5 rounds with no reloads, forces GC, and
samples JS heap, DOM nodes, event listeners and documents after each round. Round 1 is
warm-up. `suspects` lists metrics that rose every round by more than 10% after it.
Baseline on 2026-10-30 (Docker): heap +7% over 4 rounds and flattening, while listeners
(199), nodes and documents stayed flat, so no leak. A suspect means the app keeps
something alive per navigation (listeners, intervals, subscriptions). That is an app
finding, reproduced by the script.

## 3. JS coverage

```sh
npx playwright cli -s=<session> --raw run-code --filename=.agents/skills/devtools/scripts/js-coverage.js
```

This reloads once and returns, per file, its size, the share executed on load, and the
unused kB, sorted by unused bytes. On 2026-10-30 (`/events`, Docker) it found 844 kB of
JS (uncompressed), 548 kB of it unused. `msal` was 254 kB at 13% used, and a `forms`
chunk was 85 kB at 26% used on a page with no forms. Large and mostly unused points to
code splitting in the app.

## 4. One-off recipes (`run-code`)

```js
// Offline mid-session (error and retry states without mocks)
async page => {
  await page.context().setOffline(true);
};

// Throttle only, then explore by hand (undo with rate 1 / latency 0 / throughput -1)
async page => {
  const c = await page.context().newCDPSession(page);
  await c.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 400,
    downloadThroughput: 50000,
    uploadThroughput: 20000,
  });
  await c.send('Emulation.setCPUThrottlingRate', { rate: 6 });
};
```

Built-in CLI commands cover the rest: `console error`, `requests` (`--static` for
assets), `request <n>` / `response-body <n>`, `tracing-start` / `tracing-stop`, and
`resize`.

## 5. Reporting

Report numbers with their conditions: route, profile, environment, cold or warm.
Attribute each finding to the link in the chain that owns it. A perf regression is an
app finding with evidence (`bootChain` before and after), not a test change. Never raise
a test timeout to absorb it.

Chrome DevTools MCP (`chrome-devtools-mcp`) offers the same CDP data as tools, with
performance-insight summaries. It is not configured in `.mcp.json`; the scripts above
give the agents the same measurements with no extra server.
