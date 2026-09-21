# Playwright rules (agents)

Apply when editing specs, page objects, fixtures, mocks, or Zod wire schemas.
Full narrative: `CLAUDE.md`.

## Layout

| Kind        | Path                                                                                          |
| ----------- | --------------------------------------------------------------------------------------------- |
| UI spec     | `tests/features/<feature>/<feature>.ui.acceptance.spec.ts`                                    |
| API spec    | `tests/features/<feature>/<feature>.api.acceptance.spec.ts`                                   |
| Snapshot    | `tests/features/<feature>/<feature>.snapshot.acceptance.spec.ts`                              |
| A11y        | `tests/accessibility/*.a11y.acceptance.spec.ts`                                               |
| Page object | `src/ui/pages/<feature>/` — class, `page` via constructor; list pages extend `ListPage`       |
| Fixture     | `tests/features/<feature>/fixtures.ts` — `test`, `<Feature>UiFixtures`, `<feature>TestConfig` |
| API client  | `src/api/features/<feature>/`                                                                 |
| Seeded data | `tests/features/<feature>/seeded.ts`; route mocks in `mocks.ts` beside it                     |

Titles: `Given <context>, when <action>, then <business outcome>`.

## Data

1. Real seeded fixtures first.
2. Narrow with search/filter before asserting a specific card. After
   `searchFor`, assert `expectResultCount(1)` for uniqueness.
3. `route.fulfill()` only for empty, error, multi-page, and snapshot
   determinism. Parse every mock with `parseMockBody`.
4. Partial names: `SEEDED_*_PARTIAL_NAME` via `partialNameOf`, never
   `name.slice` in a spec.

## Assertions and navigation

- Web-first only. No `waitForTimeout()`, no polling loops.
- Navigate with `gotoRoute` / `gotoAppShell`, not bare `page.goto`
  (exceptions: SEO spec, snapshot `load`).
- API specs assert values and domain invariants, not `typeof`. Zod already
  validated the wire shape.
- Feature flags are pinned on (`feature-flags.fixture.ts`). Never assert the
  flag API.

## Healing (atest / playwright-fix)

- Repair locators, waits, and assertions in this repo only.
- Prefer role / `data-testid` / page-object methods over CSS.
- If the evidence shows an application defect, stop and report — do not
  weaken the assertion to match a bug.
- Do not regenerate snapshot baselines unless the change is explicitly a
  visual update (`/update-snapshots` for both darwin and linux).
- Do not add `@quarantine` as a heal. Quarantine is a human decision.

## Tags

- Every test: `@acceptance`.
- Critical path additionally: `@smoke`.
- Suite-level: feature tag, `@ui`/`@api`/`@snapshot`/`@a11y`, `@desktop` or
  `@mobile`. `@layout`/`@wide` for the wide project. `@theme` is excluded
  from light projects.
