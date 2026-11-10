# Acceptance spec: Stores

<!--
Filled example of ../templates/feature-spec.md. Titles, seeded names and AC-IDs are
real (tests/features/stores/, bjjeire-java/specs/stc/stores/spec.md) as of
2026-11-10; the Planned, Held and Rejected entries are illustrative. The living spec
is specs/features/stores.md.
-->

**App spec**: `bjjeire-java/specs/features/stores.md`
**AC-IDs**: `bjjeire-java/specs/stc/stores/spec.md`
**Slice**: `tests/features/stores/` · `src/ui/pages/stores/` · `src/api/features/stores/`
**Agent seed**: `tests/agents/seed.spec.ts` (project `agent-seed`: signed in, flags pinned on, shell mounted)
**Seeded**: `tests/features/stores/seeded.ts`
**Status**: living · **Reconciled with tests**: 2026-11-10

A visitor opens Stores and scans, searches and pages a directory of published BJJ
equipment stores. There is no county and no type: search matches the name only, on
the loaded page. The app repo's page integration tests own the search-to-cards
mechanics once (AC-STR-002); this suite proves the visitor sees it against real data.

## Scenarios (must match test titles)

### UI

1. visitor should see the store list when opening Stores (`@smoke`) · AC-STR-001
2. visitor should see an empty state when no store matches the search · AC-STR-002
3. visitor should find only the store searched for by name · AC-STR-002
4. visitor should find a store by part of its name · AC-STR-002
5. visitor should not find a store by a word only in its description · AC-STR-002
6. visitor should see the no-data message when there are no stores to show · AC-STR-003
7. visitor should see a network error message when stores cannot be loaded because the connection fails · AC-STR-003
8. visitor should see a server error message when stores cannot be loaded because of a server problem · AC-STR-003
9. visitor should see a long unbroken description stay inside its card on a phone · none (exploration 2026-10-31, F2)

All in `stores.ui.acceptance.spec.ts`; scenario 9 is in its own `describe` at a 360px viewport.

### API

1. client should receive each published store with its details · AC-STR-001
2. client should receive stores ordered by name · AC-STR-001
3. client should page through the directory in distinct slices with correct links · AC-STR-003
4. client should get a bad request for <param> "<value>" · AC-STR-004
5. client should get a validation error on <field> when <value> is out of range · AC-STR-004

Scenarios 4 and 5 are data-driven over `tests/features/common/testdata/invalid-values.ts`
(malformed integers for `page` and `pageSize`; the paging bounds). Errors are asserted as
RFC 9457 problem documents with `expectProblem`: status, `type`, and `field` + `errorCode`.

## Constraints

- No county filter and no type filter. Search matches the name only and is client-side:
  after `searchFor`, assert `expectResultCount(1)`.
- Partial name is `SEEDED_STORE_ARAN_FIGHT_GEAR_PARTIAL_NAME`, never `name.slice`.
- Environments hold full datasets. Assert that a seeded store is _included_ in the
  listing, never that page 1 equals the fixtures.
- Store cards show name, description and a website link. `status` and `isActive` are on
  the wire but never shown, so no scenario asserts them.

## Planned

#### visitor should reach a store's website from its card

- Layer: UI · Tags: @acceptance · Data: `SEEDED_STORE_ARAN_FIGHT_GEAR` (seeded) · Mocked: no
- Covers: AC-STR-001
- Oracle: the seeded record's `websiteUrl`, compared with the card link's target. No mapper arithmetic.
- Steps:
  1. When a visitor opens Stores
- Expected results:
  - And the visitor searches for Aran Fight Gear
  - Then only that store is listed
  - And its website can be reached from its card
- Why: reaching the shop is the point of the page, and no test reads the link target.
  A swapped or stale URL would pass every current test.

#### visitor should see different stores on each page

- Layer: UI · Tags: @acceptance · Data: `firstPageOfManyStores` · Mocked: yes (multi-page; seeded data fits on one page)
- Covers: AC-STR-003
- Oracle: the mock bodies, parsed with the Stores page schema, so the expected names on page 2 are the mock's and the mock cannot drift from the contract.
- Steps:
  1. Given there are more stores than fit on one page
  2. When a visitor opens Stores
- Expected results:
  - And the visitor goes to the next page
  - Then the next stores are listed instead of the first ones
- Why: the API scenario proves the slices; nothing proves the visitor can move between them.

## Held for a product decision

- `visitor should see which stores ship abroad` · Question: is delivery scope a product field or free text in the description? · Asked: 2026-11-10 · Owner: product owner

## Rejected

- `visitor should see stores ordered by name` · Why not: ordering is owned by API scenario 2; the UI renders API order, and a UI check would duplicate the cost without adding evidence.

## Findings

- **F2 (guarded)**: one long unbroken word pushed the whole page sideways on a phone. Source: `specs/exploration/2026-10-31-stores-review.md`. Guarded by scenario UI 9, which fails until the app fix is deployed.
