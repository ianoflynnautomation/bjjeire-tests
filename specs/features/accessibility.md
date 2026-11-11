# Acceptance spec: Accessibility sweep

**Requirements**: `bjjeire/requirements` · epic `&6`
**Slice**: `tests/accessibility/` (project `a11y`, `npm run test:a11y`; the project selects `*.a11y.acceptance.spec.ts` by file name)
**Agent seed**: `tests/agents/seed.spec.ts` (project `agent-seed`: signed in, flags pinned on, shell mounted)
**Support**: `expectNoWcagViolations` in `src/ui/support/` (`@axe-core/playwright`, WCAG 2.1 A and AA)
**Status**: living · **Reconciled with tests**: 2026-11-10

One axe sweep per route in each theme the a11y projects run (dark by default; light is
a separate project). Feature-specific sweeps
that need setup (an open map popup, a chosen theme) live in the feature slice instead,
named `<feature>-<area>.a11y.acceptance.spec.ts`, and are listed in that feature's spec
(for example gyms scenario 27). The app's browser tests own focus indicators and
contrast over map tiles, which axe cannot judge.

## Scenarios (must match test titles)

### UI

1. <Route> page should have no WCAG 2.1 A/AA violations · none (one test per route)

## Constraints

- Scan only after the route's content has loaded: filters are disabled until data
  arrives and disabled elements are exempt from colour contrast, so an early scan passes
  for the wrong reason. The test waits on each route's ready test id.
- No rule is disabled in the suite. A violation the product accepts is recorded in the
  app repo, not silenced here.
- Oracle: axe's rule set at the pinned `@axe-core/playwright` version.

## Planned

Scenario 1 predates the Planned convention. Candidates: keyboard operation of filters
and search (see `specs/features/events.md`, planned "using only the keyboard"), which a
static sweep cannot prove.
