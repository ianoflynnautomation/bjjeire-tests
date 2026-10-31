# Acceptance spec: Boot performance

**Slice**: `tests/performance/boot.perf.acceptance.spec.ts` (project `perf`, opt-in with `PW_PERF=true`)
**Support**: `src/ui/support/performance.ts`
**Diagnosis**: `.agents/skills/devtools/` (`boot-profile.js` shows the chain behind a miss)

## UI scenarios

For every header route (Events, Gyms, Competitions, Stores, About) and each profile
(desktop broadband; slow 4G phone at 150 ms RTT, 1.6 Mbit/s, 4x CPU), the visitor
should see the route load within budget, cold cache:

| Profile | Shell (header) | First content | LCP       | CLS   |
| ------- | -------------- | ------------- | --------- | ----- |
| desktop | ≤ 2000 ms      | ≤ 3000 ms     | ≤ 2500 ms | ≤ 0.1 |
| slow4g  | ≤ 6000 ms      | ≤ 8000 ms     | ≤ 4000 ms | ≤ 0.1 |

Titles: `visitor should see <Route> load within budget on <profile label>`.

## Constraints

- One worker, no retries. Docker numbers are lower bounds for AKS.
- LCP and CLS use Web Vitals "good" thresholds. Shell and content budgets cover the
  serial boot chain (document → `/featureflag` → route chunk → list API).
- Known misses (2026-10-30, Docker): desktop CLS on Events 0.295, Gyms 0.328 and
  Competitions 0.233. These are app findings; the budget stays.
