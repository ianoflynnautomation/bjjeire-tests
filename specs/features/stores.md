# Acceptance spec: Stores

**App spec**: `bjjeire-java/specs/features/stores.md`
**Requirements**: `bjjeire/requirements` · epic `&4`
**Slice**: `tests/features/stores/` · `src/ui/pages/stores/` · `src/api/features/stores/`
**Agent seed**: `tests/agents/seed.spec.ts` (project `agent-seed`: signed in, flags pinned on, shell mounted)
**Seeded**: `tests/features/stores/seeded.ts`
**Status**: living · **Reconciled with tests**: 2026-11-10

A visitor opens Stores and scans, searches and pages a directory of published BJJ
equipment stores. There is no county and no type: search matches the name only, on the
loaded page. The app repo's page integration tests own the search-to-cards mechanics
once (`#4002` T4); this suite proves the visitor sees it against real data.

## Scenarios (must match test titles)

### UI

1. visitor should see the store list when opening Stores (`@smoke`) · `#4001`
2. visitor should see an empty state when no store matches the search · `#4002`
3. visitor should find only the store searched for by name · `#4002`
4. visitor should find a store by part of its name · `#4002`
5. visitor should not find a store by a word only in its description · `#4002`
6. visitor should see the no-data message when there are no stores to show · `#4003`
7. visitor should see a network error message when stores cannot be loaded because the connection fails · `#4003`
8. visitor should see a server error message when stores cannot be loaded because of a server problem · `#4003`
9. visitor should see a long unbroken description stay inside its card on a phone · none (exploration 2026-10-31, F2)

All in `stores.ui.acceptance.spec.ts`; 6–8 are mocked; 9 runs in its own `describe` at a
360px viewport on the desktop project.

### API

1. client should receive each published store with its details (`@smoke`) · `#4001`
2. client should receive stores ordered by name · `#4001`
3. client should page through the directory in distinct slices with correct links · `#4003`
4. client should get a bad request for <param> "<value>" · `#4004`
5. client should get a validation error on <param> when <param> <value> is out of range · `#4004`

Scenarios 4 and 5 are data-driven over `tests/features/common/testdata/invalid-values.ts`
(non-numeric paging values; the paging bounds). Errors are asserted as RFC 9457 problem
documents (`expectProblem`): status, `type`, and `field` + `errorCode`.

## Constraints

- No county filter and no type filter. Search matches the name only and is client-side:
  after `searchFor`, assert `expectResultCount(1)`.
- Partial name is `SEEDED_STORE_*_PARTIAL_NAME`, never `name.slice`.
- Environments hold full datasets. Assert that a seeded store is _included_ in the
  listing, never that page 1 equals the fixtures.
- Store cards show name, description and a website link. `status` and `isActive` are on
  the wire but never shown, so no scenario asserts them.

## Planned

Scenarios 1–9 predate the Planned convention; the test is their design note. New
scenarios get a block here first (see `specs/templates/feature-spec.md`).

## Held for a product decision

None.

## Rejected

- `visitor should see stores ordered by name` · Why not: API scenario 2 owns ordering;
  the UI renders API order.

## Findings

- **F2 (guarded)**: one long unbroken word pushed the whole page sideways on a phone.
  Source: `specs/exploration/2026-10-31-stores-review.md`. Guarded by scenario UI 9.
- **F1, F3–F5**: see the same report (F1 resolved 2026-10-31; F3 is the shared header,
  tracked in the gyms report; F4 and F5 are copy and heading findings for the app repo).
