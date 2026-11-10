# Acceptance spec: Boot performance

**Slice**: `tests/performance/boot.perf.acceptance.spec.ts` (project `perf`, opt-in with `PW_PERF=true`)
**Agent seed**: none (budgets are measured by the perf project, not explored)
**Support**: `src/ui/support/performance.ts`
**Diagnosis**: `.agents/skills/devtools/` (`boot-profile.js` shows the chain behind a miss)
**Status**: living · **Reconciled with tests**: 2026-11-10

## Scenarios (must match test titles)

### UI

1. visitor should see <Route> load within budget on <profile> · none (budgets below)

One test per header route (Events, Gyms, Competitions, Stores, About) and per profile
(desktop broadband; slow 4G phone at 150 ms RTT, 1.6 Mbit/s, 4x CPU), cold cache. The
visitor should see the route load within budget:

| Profile | Shell (header) | First content | LCP       | CLS   |
| ------- | -------------- | ------------- | --------- | ----- |
| desktop | ≤ 2000 ms      | ≤ 3000 ms     | ≤ 2500 ms | ≤ 0.1 |
| slow4g  | ≤ 6000 ms      | ≤ 8000 ms     | ≤ 4000 ms | ≤ 0.1 |

## Constraints

- One worker, no retries. Docker numbers are lower bounds for AKS.
- LCP and CLS use Web Vitals "good" thresholds. Shell and content budgets cover the
  serial boot chain (document → `/featureflag` → route chunk → list API).
- Oracle: the budget table above. A miss is an app finding, never a reason to raise
  the budget in the same change.

## Findings

- **Known misses (2026-10-30, Docker)**: desktop CLS on Events 0.295, Gyms 0.328 and
  Competitions 0.233. App findings; the budget stays.
