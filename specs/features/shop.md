# Acceptance spec: Shop

**App spec**: `bjjeire-java/specs/features/shop.md` (design record: `bjjeire-java/specs/003-bjjeire-merch-shop/spec.md`)
**Requirements**: `bjjeire/requirements` · epic `&4` (directory, `#4001`–`#4007`) · merch epic (`#6001`–`#6028`, provisional; listed as their slices ship)
**Slice**: `tests/features/stores/` · `src/ui/pages/stores/` · `src/api/features/stores/`
**Agent seed**: `tests/agents/seed.spec.ts` (project `agent-seed`: signed in, flags pinned on, shell mounted)
**Seeded**: `tests/features/stores/seeded.ts`
**Status**: living · **Reconciled with tests**: 2026-11-17

A visitor opens Shop (called Stores until the merch shop's slice 1) at `/shop` and scans,
searches and pages a directory of published BJJ equipment stores. The old `/stores`
address redirects to `/shop`. Only the visible name and the address changed: the API
(`/api/v1/store`), the `Stores` flag and the `stores-*` / `store-card-*` test ids keep their
names. BJJ Éire's own merch will sit above the directory, behind the `Merch` flag; it is not
built yet. There is no county and no type: search matches the name only, on the
loaded page. The app repo's page integration tests own the search-to-cards mechanics
once (`#4002` T4); this suite proves the visitor sees it against real data.

## Scenarios (must match test titles)

### UI

1. visitor should see the store list when opening Shop (`@smoke`) · `#4001`
2. visitor should see an empty state when no store matches the search · `#4002`
3. visitor should find only the store searched for by name · `#4002`
4. visitor should find a store by part of its name · `#4002`
5. visitor should not find a store by a word only in its description · `#4002`
6. visitor should see the no-data message when there are no stores to show · `#4003`
7. visitor should see a network error message when stores cannot be loaded because the connection fails · `#4003`
8. visitor should see a server error message when stores cannot be loaded because of a server problem · `#4003`
9. visitor should see a long unbroken description stay inside its card on a phone · none (exploration 2026-10-31, F2)
10. visitor should see Shop in the navigation instead of Stores · `#4005`
11. visitor should land on the Shop page when choosing Shop in the navigation · `#4005`, `#4006`
12. visitor should land on the Shop page when following an old Stores link <label> · `#4007`
13. visitor should return to the page before the old Stores link when going back · `#4007`

All in `stores.ui.acceptance.spec.ts`; 6–8 are mocked; 12 is data-driven over two old links; 9 runs in its own `describe` at a
360px viewport on the desktop project.

### API

1. client should receive each published store with its details (`@smoke`) · `#4001`
2. client should receive stores ordered by name · `#4001`
3. client should page through the directory in distinct slices with correct links · `#4003`
4. client should get a bad request for <param> "<value>" · `#4004`
5. client should get a validation error on <param> when <param> <value> is out of range · `#4004`
6. client should find the Shop address and no Stores address in the site map · `#4007`

Scenarios 4 and 5 are data-driven over `tests/features/common/testdata/invalid-values.ts`
(non-numeric paging values; the paging bounds). Scenario 6 reads `/sitemap.xml` from the app host (`BASE_URL`), not the API, and compares the path of each `<loc>` entry. Errors are asserted as RFC 9457 problem
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

### Stores becomes Shop (`#4005`–`#4007`)

The app now serves the directory at `/shop`. When these blocks were automated, the stores
page object's route became `/shop`, UI scenario 1's title became "visitor should see the
store list when opening Shop", and scenarios 1–9 then proved `#4006` on the new address.
The heading and tab title say "Shop"; the directory's own copy (search label, counts, the
"No Stores Found" empty state) is unchanged, because it names the stores, not the section.

#### visitor should see Shop in the navigation instead of Stores

- Covers: `#4005`
- Oracle: the app spec `specs/features/shop.md` (the section is called Shop at `/shop`). Not a calculation shared with the app.
- Steps:
  1. When a visitor opens the home page
- Expected results:
  - Then the header offers a Shop link to `/shop`
  - And the header offers no Stores link
  - And the footer quick links offer a Shop link to `/shop`

Test design: UI · @acceptance · flags pinned on · not mocked · default seed

#### visitor should land on the Shop page when choosing Shop in the navigation

- Covers: `#4005`, `#4006`
- Oracle: the seeded stores, and the app spec's page name "Shop". Not a calculation shared with the app.
- Steps:
  1. When a visitor opens the home page
  2. And the visitor chooses Shop in the header
- Expected results:
  - Then the address is `/shop`
  - And the main heading is "Shop"
  - And the tab title is "Shop | BJJ Éire"
  - And a seeded store's card is listed

Test design: UI · @acceptance · `SEEDED_STORE_*` (seeded) · not mocked · default seed

#### visitor should land on the Shop page when following an old Stores link <label>

- Covers: `#4007`
- Oracle: the app spec `specs/features/shop.md` FR-004 (`/stores/*` redirects to `/shop` with replace). Not a calculation shared with the app.
- Steps:
  1. When a visitor opens <address>
- Expected results:
  - Then the address is `/shop`
  - And the main heading is "Shop"
  - And a seeded store's card is listed

Test design: UI · @acceptance · data-driven over `to the directory` (`/stores`) and `to a page under it` (`/stores/some-old-page`) · not mocked · default seed

#### visitor should return to the page before the old Stores link when going back

- Covers: `#4007`
- Oracle: the app spec FR-004 (the redirect replaces the history entry, so `/stores` is not left in history). Not a calculation shared with the app.
- Steps:
  1. When a visitor opens Gyms
  2. And the visitor opens `/stores`
  3. And the visitor goes back
- Expected results:
  - Then the address is `/gyms`

Test design: UI · @acceptance · not mocked · default seed

#### client should find the Shop address and no Stores address in the site map

- Covers: `#4007`
- Oracle: the app spec FR-004 (the site map lists `/shop` and not `/stores`). Not a calculation shared with the app.
- Steps:
  1. When a client requests the site map from the app
- Expected results:
  - Then it lists the Shop address
  - And it lists no address under the old Stores one

Test design: API (static file on the app host) · @acceptance · not mocked

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
