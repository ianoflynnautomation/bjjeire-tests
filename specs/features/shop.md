# Acceptance spec: Shop

**App spec**: `bjjeire-java/specs/features/shop.md` (design record: `bjjeire-java/specs/003-bjjeire-merch-shop/spec.md`)
**Requirements**: `bjjeire/requirements` · epic `&4` (directory, `#4001`–`#4007`) · merch epic (`#6001`–`#6028`, provisional; listed as their slices ship)
**Slice**: `tests/features/stores/` · `src/ui/pages/stores/` · `src/api/features/stores/`
**Agent seed**: `tests/agents/seed.spec.ts` (project `agent-seed`: signed in, flags pinned on, shell mounted)
**Seeded**: `tests/features/stores/seeded.ts`
**Status**: living · **Reconciled with tests**: 2026-11-18

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
14. visitor should find a store when searching in a different letter case · `#4002`
15. visitor should see the full list again when clearing the search · `#4002`
16. visitor should see the search applied when opening a Shop link that carries a search term · `#4002`
17. visitor should see the store list on a phone · `#4001`
18. visitor should see a store with no description or logo as a card with its name and website link · `#4001`, `#4006`
19. visitor should see no match when searching for an unpublished store by its exact name · `#4001`

All in `stores.ui.acceptance.spec.ts` except 18 and 19, which are in `stores-seed-cases.ui.acceptance.spec.ts`; 6–8 are mocked; 12 is data-driven over two old links; 9 runs in its own `describe` at a
360px viewport on the desktop project; 17 runs in its own `@mobile` describe on the mobile projects only.

### API

1. client should receive each published store with its details (`@smoke`) · `#4001`
2. client should receive stores ordered by name · `#4001`
3. client should page through the directory in distinct slices with correct links · `#4003`
4. client should get a bad request for <param> "<value>" · `#4004`
5. client should get a validation error on <param> when <param> <value> is out of range · `#4004`
6. client should find the Shop address and no Stores address in the site map · `#4007`
7. client should receive an empty page when asking past the last page of the directory · `#4003`
8. client should not receive an unpublished store in the directory · `#4001`

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

### Directory seed cases (`#4001`, planned 2026-11-19)

The app's test dataset seeds `Fastnet Grappling Co` (`acce77500000000000000004`, `isActive: false`) and `Burren Mats`
(`acce77500000000000000005`, no description, no logo) for these blocks; both are in `tests/features/stores/seeded.ts`, with Fastnet outside `SEEDED_STORES_BY_NAME`.

#### client should not receive an unpublished store in the directory

- Covers: `#4001`
- Oracle: the app's STC overlay `#4001` (inactive stores are excluded) and the seed file's `isActive: false`. Not a calculation shared with the app.
- Steps:
  1. When a client requests the store directory, page by page to the end
- Expected results:
  - Then no store has the unpublished store id
  - And no store has the unpublished store name
  - And every store the directory reported was received
  - And the published store seeded alongside it is listed
- Why: an unpublished store is one the owner took down; listing it would send visitors to a shop BJJ Éire no longer vouches for.

Test design: API · @acceptance · seeded (`Fastnet Grappling Co`, `Burren Mats` as control) · not mocked · default seed. The API has no name filter (`GET /api/v1/store` takes only `page` and `pageSize`, 1 to 100), so absence is proved by walking every page: start at `page=1`, `pageSize=100`, follow `hasNextPage` until false, and collect every `id` and `name`. Do not stop at page 1: environments hold full datasets. Assert the walk collected as many stores as the first page's `totalItems`, so a walk cut short cannot pass. Also assert the published store seeded alongside it (`SEEDED_STORE_BURREN_MATS`) is listed, so the test cannot pass on an environment that lacks the new seed. Add a loop bound to the walk and fail with a message if it is exceeded.

#### visitor should see a store with no description or logo as a card with its name and website link

- Covers: `#4001`, `#4006`
- Oracle: the seed file (`description: null`, `logoUrl: null`) and the app spec (cards show name, description and a website link; both description and logo are optional). Not a calculation shared with the app.
- Steps:
  1. When a visitor opens Shop
  2. And the visitor searches for the seeded store's name
- Expected results:
  - Then one card is shown, named as the seeded store
  - And it links to the store's website
  - And it shows no description
  - And it shows the logo fallback in place of a logo image
- Why: the card is the only place a missing field can render as an empty box or a broken image.

Test design: UI · @acceptance · seeded (`Burren Mats`) · not mocked · default seed. Search by name, then `expectResultCount(1)`. Explored 2026-11-19: the card renders a heading "Burren Mats", a placeholder shopping-bag tile in the logo area (`store-card-logo-fallback`), and one link "Visit Website" (accessible name "Visit Website for Burren Mats") to `https://burren-mats.example.ie/`. No `store-card-description` and no `store-card-logo` image exist. Assert absence of those two and visibility of the fallback and link, rather than asserting on empty text.

#### visitor should see no match when searching for an unpublished store by its exact name

- Covers: `#4001`
- Oracle: the seed file `fastnet-grappling-co.json` (`isActive: false`) and the app's STC overlay `#4001`. Not a calculation shared with the app.
- Steps:
  1. When a visitor opens Shop
  2. And the visitor searches for the published seed store and sees it listed
  3. And the visitor searches for the unpublished store's exact name
- Expected results:
  - Then the no-match message is shown
  - And no store is listed
- Why: a store the owner took down that still turns up when a visitor searches for it by name sends them to a shop BJJ Éire no longer vouches for.

Test design: UI · @acceptance · seeded (`Fastnet Grappling Co`, name from `SEEDED_STORE_FASTNET_GRAPPLING_CO`) · not mocked · default seed. Explored: the page shows "Showing 0 stores" and the "No Results Found" state; the existing empty-state expectation for scenario UI 2 can be reused. Search is client-side over the loaded set (the page fetches `pageSize=100` when a term is entered), so the absence is proved by the API walk; this block only proves the visitor sees it. Step 2 is a positive control (`SEEDED_STORE_BURREN_MATS`, `expectResultCount(1)`), so the test cannot pass on an environment where the seed was never loaded.

Paging needs no more seeded stores. API scenario 3 already pages the seed in distinct slices with a small `pageSize`. The UI pager is owned at T4 by the app's `shop-page.integration.test.tsx` (`#4003`, `seedStoresPaged`). Seeding 21 stores only to page the UI at the fixed size of 20 would be data for its own sake.

### Merch switched off (`#6026`, planned 2026-11-18, slice 0)

Behaviour: `bjjeire-java/specs/stc/shop/spec.md` § `#6026` and ADR-0016. The `Merch` switch is off by default
(`FEATURE_MERCH=false`). Production and the default Compose stack run it off until the shop launches, but a local
`.env` may switch it on, as a stack with every flag on does. While it is off, every product and order route answers
404 before sign-in, whatever token is sent. No merch screen exists yet, so the visitor-facing half of `#6026` (no
merch section, basket, product page or merch admin screen) gets its blocks with slice 2. No test claims this
block yet.

#### client should not reach the merch shop while merch is switched off <route>

- Covers: `#6026`
- Oracle: ADR-0016 and the app's STC overlay (`/api/v1/product/**` and `/api/v1/order/**` answer 404 `urn:bjjeire:not-found` while `Merch` is off). Not a calculation shared with the app.
- Steps:
  1. Given the environment's flag endpoint reports `Merch: false`
  2. When a client calls <route> without a token
- Expected results:
  - Then the response is a 404 problem document of type `urn:bjjeire:not-found`
  - And it carries a `traceId`
  - And it is not a 401: the route is absent, not protected
- Why: a switched-off shop that answered 401 instead would tell anyone probing the API that order and product routes exist, and a 200 would mean guest checkout is open before launch.

Test design: API · @acceptance · data-driven over `the catalogue` (`GET /api/v1/product`), `the delivery fee` (`GET /api/v1/order/delivery`), `checkout` (`POST /api/v1/order`), `the organiser's orders` (`GET /api/v1/order/admin`) and `the shop webhook` (`POST /api/v1/order/stripe-webhook`) · not mocked · no data. Read `/api/v1/featureflag` first and skip, with the reason, when it reports `Merch: true`, as `tests/features/competitions/switched-on-ui.ts` does for its flag. A stack with every flag on skips it by design; run it against one started with `FEATURE_MERCH=false` (or the default). With `Merch` on, these routes answer 404 only because no controller exists yet, so a 404 there proves nothing about the switch. Assert with `expectProblem` (status and `type`), never on the `detail` wording.

### Directory search behaviour (planned 2026-11-18)

Explored live: the search box is case-insensitive, updates the "Found N store(s)" count, keeps the term in the
address as `?q=`, and a "Clear search" button restores the full list. None of this has a scenario yet.

#### visitor should find a store when searching in a different letter case

- Covers: `#4002`
- Oracle: the seeded store `SEEDED_STORE_ARAN_FIGHT_GEAR`. The name is matched whatever the case typed.
- Steps:
  1. When a visitor opens Shop
  2. And the visitor searches for the seeded store's name in upper case
- Expected results:
  - Then only that store is listed
- Why: a case-sensitive match would send visitors who type "aran" to an empty state although the store exists.

Test design: UI · @acceptance · `SEEDED_STORE_ARAN_FIGHT_GEAR` · not mocked · default seed. Use `name.toUpperCase()`; assert `expectResultCount(1)` then `expectCardData`.

#### visitor should see the full list again when clearing the search

- Covers: `#4002`
- Oracle: the seeded store `SEEDED_STORE_ARAN_FIGHT_GEAR` narrows the list to one card; clearing the search widens it again.
- Steps:
  1. When a visitor opens Shop
  2. And the visitor searches for the seeded store's name
  3. And only that store is listed
  4. And the visitor clears the search
- Expected results:
  - Then the search box is empty
  - And more than one store is listed
  - And the address carries no search term
- Why: a visitor stuck on a one-store result with no way back would think the directory is nearly empty.

Test design: UI · @acceptance · `SEEDED_STORE_ARAN_FIGHT_GEAR` · not mocked · default seed. Use the existing `clearSearchWithButton()`. After clearing, assert `expectMoreThanOneResult()` (more than one card, never a named second store or the unfiltered count: the environment holds a full dataset).

#### visitor should see the search applied when opening a Shop link that carries a search term

- Covers: `#4002`
- Oracle: the seeded store `SEEDED_STORE_ARAN_FIGHT_GEAR`; a shared link `/shop?q=<name>` shows only that store.
- Steps:
  1. When a visitor opens a Shop link that already searches for the seeded store's name
- Expected results:
  - Then the search box holds that name
  - And only that store is listed
- Why: a shared or bookmarked search that loads the full list instead misleads the person who opens it.

Test design: UI · @acceptance · `SEEDED_STORE_ARAN_FIGHT_GEAR` · not mocked · default seed. Open `/shop?q=<encoded name>` through `gotoRoute`; the term travels in the address as `q`. Also check the search box, so this is not satisfied by a filtered list with an empty box.

#### visitor should see the store list on a phone

- Covers: `#4001`
- Oracle: the seeded store `SEEDED_STORE_ARAN_FIGHT_GEAR`: its card shows name, description and a website link.
- Steps:
  1. When a visitor opens Shop on a phone
  2. And the visitor searches for the seeded store's name
- Expected results:
  - Then the store list is displayed
  - And only that store is listed
  - And the seeded store's card shows its name, description and website link
  - And the page fits the screen
- Why: a phone card that drops its details or a page that scrolls sideways makes the directory unusable for most visitors; the only other phone check uses a mocked long description.

Test design: UI · `@mobile` · `@acceptance` (not `@smoke`: smoke scenario 1 already runs on the mobile projects) · `SEEDED_STORE_ARAN_FIGHT_GEAR` · not mocked · searched by name so the card does not depend on page 1 of the unfiltered list · phone viewport (mobile-iphone and mobile-galaxy projects), in its own `@mobile` describe.

#### client should receive an empty page when asking past the last page of the directory

- Covers: `#4003`
- Oracle: the app spec FR-001 (`PagedResponse<StoreDto>`) and the observed contract: `data` empty, no next page, a previous page link.
- Steps:
  1. When a client requests a page far past the last one
- Expected results:
  - Then the page has no stores
  - And it reports no next page
  - And it reports a previous page
- Why: a client paging with a stale total that got an error or repeated entries would loop or crash instead of stopping.

Test design: API · @acceptance · not mocked · default seed. Use `page=10000`, `pageSize=20`; parse with the stores page schema and assert `data` length 0, `hasNextPage` false, `hasPreviousPage` true. Do not assert `totalItems` (the environment holds a full dataset).

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
