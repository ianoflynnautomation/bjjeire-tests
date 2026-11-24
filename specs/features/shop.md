# Acceptance spec: Shop

**App spec**: `bjjeire-java/specs/features/shop.md` (design record: `bjjeire-java/specs/003-bjjeire-merch-shop/spec.md`)
**Requirements**: `bjjeire/requirements` · epic `&4` (directory, `#4001`–`#4007`) · merch epic (`#6001`–`#6028`, provisional; listed as their slices ship)
**Slice**: `tests/features/stores/` · `src/ui/pages/stores/` · `src/api/features/stores/`
**Agent seed**: `tests/agents/seed.spec.ts` (project `agent-seed`: signed in, flags pinned on, shell mounted)
**Seeded**: `tests/features/stores/seeded.ts`
**Status**: living · **Reconciled with tests**: 2026-11-23

A visitor opens Shop (called Stores until the merch shop's slice 1) at `/shop` and scans,
searches and pages a directory of published BJJ equipment stores. The old `/stores`
address redirects to `/shop`. Only the visible name and the address changed: the API
(`/api/v1/store`), the `Stores` flag and the `stores-*` / `store-card-*` test ids keep their
names. BJJ Éire's own merch sits above the directory, behind the `Merch` flag (app slice 2: the
catalogue, product pages and the organiser's product admin). There is no county and no type: search matches the name only, on the
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
20. visitor should see the organiser sign-in when opening the shop admin without signing in · `#6017`
21. visitor should still see the store directory when the merch cannot be loaded · none
22. visitor should see the merch section fit a phone · `#6001`
23. visitor should see a product page fit a phone · `#6002`
24. visitor should still have their basket after reloading the page · `#6005`
25. visitor should see an empty basket with a way back to Shop when nothing has been added · `#6005`

All in `stores.ui.acceptance.spec.ts` except 18 and 19, which are in `stores-seed-cases.ui.acceptance.spec.ts`, and 20 and 21, which are in `stores-merch.ui.acceptance.spec.ts`, and 24 and 25 in the same file, and 22 and 23, which are in `stores-merch-phone.ui.acceptance.spec.ts`; 6–8 are mocked; 12 is data-driven over two old links; 9 runs in its own `describe` at a
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
9. client should receive the merch catalogue ordered by kind and then name · `#6001`
10. client should get a validation error on <param> when <param> <value> is out of range for the merch catalogue · `#6001`
11. client should get not found for <resource> that does not exist · `#6002`
12. client should be refused <action> in the shop admin without signing in · `#6017`
13. client should be refused a checkout whose quantities are out of bounds <case> · `#6005`
14. client should receive the delivery fee and the countries the shop delivers to · `#6006`
15. client should receive a product photo as a long-lived image · `#6002`

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
merch section, basket, product page or merch admin screen) has its block under "BJJ Éire merch on Shop" below. No test claims this
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

Test design: API · @acceptance · data-driven over `the catalogue` (`GET /api/v1/product`), `the delivery fee` (`GET /api/v1/order/delivery`), `checkout` (`POST /api/v1/order`), `the organiser's orders` (`GET /api/v1/order/admin`) and `the shop webhook` (`POST /api/v1/order/stripe-webhook`) · not mocked · no data. Read `/api/v1/featureflag` first and skip, with the reason, when it reports `Merch: true`, as `tests/features/competitions/switched-on-ui.ts` does for its flag. A stack with every flag on skips it by design; run it against one started with `FEATURE_MERCH=false` (or the default). With `Merch` on, the catalogue answers 200 (app slice 2) and the order routes still answer 404 only because no controller exists yet, so a 404 there proves nothing about the switch. Assert with `expectProblem` (status and `type`), never on the `detail` wording.

### BJJ Éire merch on Shop (`#6001`–`#6004`, `#6026`, planned 2026-11-19, slice 2)

Behaviour: `bjjeire-java/specs/features/shop.md` Part 2 (User Story 5) and `specs/stc/shop/spec.md` § `#6001`–`#6004`.
With the `Merch` switch on, Shop shows a "BJJ Éire merch" section above the directory search, and each product has a
page at `/shop/products/<slug>`. The app's test dataset (`seeder/data-test/products/`) seeds three published products
with one photo each: `Harp Rashguard` (`harp-rashguard`, €45.00; S, M, L in stock, XL `stock: 0`), `Competition Shorts`
(`competition-shorts`, €35.00; M only, 4 in stock) and `Logo T-Shirt` (`logo-t-shirt`, €25.00; S, M, L). No seeded
product is wholly sold out, so the card's "Out of stock" mark is owned at T4 by the app's
`shop-page-merch.integration.test.tsx`. Test ids: `merch-featured*`, `merch-card-*`, `product-page-*`
(`src/constants/merchDataTestIds.ts`). No test claims these blocks yet.

#### visitor should see BJJ Éire merch above the store directory when opening Shop

- Covers: `#6001`
- Oracle: the app's product test seed (names, kinds, prices). Not a calculation shared with the app.
- Steps:
  1. Given the merch shop is switched on
  2. When a visitor opens Shop
- Expected results:
  - Then a "BJJ Éire merch" section is shown above the directory search
  - And it lists the seeded rashguard, shorts and t-shirt, in that order
  - And the seeded rashguard's card shows its photo, its name, "Rashguard" and "€45.00"
  - And the seeded rashguard's card has no "Out of stock" mark
  - And a seeded store's card is still listed below
- Why: the merch is the reason for the feature; placing it at the top of Shop was the owner's request.

Test design: UI · @acceptance @merch-on · seeded products · not mocked · default seed. Config grep-excludes `@merch-on` unless `MERCH_FLAG=on`; the Given step fails naming `MERCH_FLAG` when the real flag disagrees. The environment may hold more products than the seed: assert the seeded three are present and in kind order relative to each other, never that the section holds exactly three. The photo is checked as loaded (`naturalWidth > 0`), not by its address.

#### visitor should see a product's photos, description, price and sizes with sold-out sizes marked

- Covers: `#6002`
- Oracle: the seed file `acceptance-products.json` (`harp-rashguard`: S, M, L in stock; XL `stock: 0`). Not a calculation shared with the app.
- Steps:
  1. Given the merch shop is switched on
  2. When a visitor opens Shop
  3. And the visitor opens the seeded rashguard
- Expected results:
  - Then the product page shows its name, "Rashguard", "€45.00", its description and its photo
  - And it offers the sizes S, M, L and XL, in that order
  - And XL is marked sold out and cannot be chosen
  - And M can be chosen
- Why: a shopper who picks a size that is gone would only find out at payment.

Test design: UI · @acceptance @merch-on · seeded `harp-rashguard` · not mocked · default seed. Open it from its card, not by address, so the card link is proved too. The sizes are radio buttons; the sold-out one is named "XL, sold out".

#### visitor should see "Product not found" with a way back to Shop when opening a product that is not on sale

- Covers: `#6002`
- Oracle: the app's STC overlay `#6002` (a draft, hidden or unknown product answers 404 and the page says "Product not found"). Not a calculation shared with the app.
- Steps:
  1. Given the merch shop is switched on
  2. When a visitor opens the address of a product that does not exist
- Expected results:
  - Then the page says "Product not found"
  - And it offers a link back to Shop, which leads to `/shop`
- Why: an old or mistyped link must not leave a visitor on an error screen with nowhere to go.

Test design: UI · @acceptance @merch-on · no data (a slug that is never seeded, such as `no-such-product-<unique>`) · not mocked.

#### visitor should see no merch section on Shop when no product is on sale

- Covers: `#6003`
- Oracle: the app's STC overlay `#6003` (an empty catalogue means no section and no placeholder). Not a calculation shared with the app.
- Steps:
  1. Given the merch shop is switched on
  2. And no product is on sale
  3. When a visitor opens Shop
- Expected results:
  - Then there is no "BJJ Éire merch" section and no placeholder for one
  - And a seeded store's card is listed
- Why: an empty "BJJ Éire merch" heading would look like the shop is broken rather than not yet stocked.

Test design: UI · @acceptance @merch-on · mocked catalogue (route `GET /api/v1/product` answered with an empty page), because the test dataset always seeds products and the suite never hides the seeded ones · directory not mocked · default seed. The API half (an empty page) is owned at T2 by the app's `ProductIT`.

#### visitor should keep seeing the merch while searching the store directory

- Covers: `#6004`
- Oracle: the seeded rashguard and a store name that matches nothing.
- Steps:
  1. Given the merch shop is switched on
  2. When a visitor opens Shop
  3. And the visitor searches the directory for a name no store has
- Expected results:
  - Then the directory shows its no-match message
  - And the "BJJ Éire merch" section still lists the seeded rashguard
- Why: search belongs to the directory; a merch section that vanished while searching would look like the shop closed.

Test design: UI · @acceptance @merch-on · seeded products · not mocked · default seed. Use a unique nonsense term. The app's page test owns the "fetched once" half (`#6004` T4).

#### client should receive the published merch without stock counts

- Covers: `#6001`, `#6002`
- Oracle: the seed file `acceptance-products.json` and the app's STC contract (sizes carry `available` and `soldOut`, never `stock` or `held`). Not a calculation shared with the app.
- Steps:
  1. Given the merch shop is switched on
  2. When a client requests the merch catalogue and the seeded rashguard's page
- Expected results:
  - Then the catalogue includes the three seeded products with their kind and price
  - And the rashguard's sizes are S, M, L and XL, with XL sold out
  - And no size carries a stock count or a held count
- Why: stock counts are the organiser's business data; exposing them tells competitors and scrapers what sells.

Test design: API · @acceptance @merch-on · seeded products · not mocked · default seed. Use `productsPageSchema` and `productSchema` from `src/api/features/stores/products.schemas.ts` (re-exported from the generated contract). Assert the absence of `stock` and `held` on the raw JSON, not after schema parsing, which would strip them.

#### visitor should see only the store directory on Shop while merch is switched off

- Covers: `#6026`
- Oracle: ADR-0016 and the app's STC overlay `#6026`. Not a calculation shared with the app.
- Steps:
  1. Given the merch shop is switched off
  2. When a visitor opens Shop
  3. And the visitor opens the seeded rashguard's product address
- Expected results:
  - Then Shop shows the store directory and no "BJJ Éire merch" section
  - And the product address does not show the product
- Why: the owner launches merch when stock and photos are ready; a half-visible shop before then would take orders it cannot fill.

Test design: UI · @acceptance · not mocked. Read `/api/v1/featureflag` first and skip, with the reason, when it reports `Merch: true` (same rule as the API block above). The product address falls back to the app's default page while the switch is off; assert the product name is absent rather than a particular landing page.

### Organiser manages merch (`#6013`, `#6014`, `#6016`, planned 2026-11-19, slice 2)

Behaviour: `bjjeire-java/specs/features/shop.md` Part 2 (User Story 6). The organiser signs in with the existing
organiser sign-in and manages products at `/admin/shop` and `/admin/shop/products/<id>`. No navigation entry leads
there. Test ids: `merch-admin-*`. Every block here creates its own product with a unique slug and deletes or hides
it afterwards (only a draft can be deleted; a published one is hidden). They never edit the three seeded products.
No test claims these blocks yet.

#### organiser should save a new product as a draft that visitors cannot see

- Covers: `#6013`
- Oracle: the product the test creates, with a unique name and slug.
- Steps:
  1. Given the organiser is signed in with the local organiser sign-in
  2. When the organiser adds a rashguard with a price and stock in three sizes
  3. And adds a photo to it
- Expected results:
  - Then the shop admin lists it as a draft
  - And its photo is shown in the editor
  - And a visitor opening Shop does not see it in the merch section
  - And a visitor opening its product address sees "Product not found"
- Why: the organiser prepares products before launch; a draft that leaked onto Shop could be bought before it is ready.

Test design: UI · @acceptance @merch-on @local-sign-in · creates its own draft (unique slug), deletes it afterwards · not mocked · local and docker only. Upload a small PNG fixture (under 5 MB). Check the visitor half in a second, signed-out browser context.

#### organiser should publish a product so visitors see it, and hide it so they no longer do

- Covers: `#6014`
- Oracle: the product the test creates.
- Steps:
  1. Given the organiser is signed in with the local organiser sign-in
  2. And has a draft product with a photo
  3. When the organiser publishes it
  4. And later hides it
- Expected results:
  - Then after publishing, a visitor sees it in the merch section and can open its page
  - And after hiding, a visitor no longer sees it in the merch section and its page says "Product not found"
- Why: publishing and hiding are how the organiser launches and withdraws merch.

Test design: UI · @acceptance @merch-on @local-sign-in · creates its own product, hides it at the end · not mocked · local and docker only. A write evicts the catalogue cache on the API replica that served it; the other replicas' copy expires within 30 seconds, and the SPA refetches a merch read older than 30 seconds (SC-006: within a minute). On a single-replica stack the next read shows the change. On a multi-replica environment, poll the visitor page for up to 60 seconds rather than asserting on the first read.

#### organiser should see a size the shop shows as sold out straight after setting its stock to zero

- Covers: `#6016`
- Oracle: the product the test creates, published with stock in three sizes.
- Steps:
  1. Given the organiser is signed in with the local organiser sign-in
  2. And has published a product with stock in sizes S, M and L
  3. When the organiser sets the stock of M to 0
- Expected results:
  - Then the stock table shows M with 0 available
  - And a visitor opening the product sees M marked sold out and cannot choose it
  - And S and L can still be chosen
- Why: SC-006 (the shop reflects a stock change within a minute); a size shown in stock after it ran out is a sale the organiser cannot fill.

Test design: UI · @acceptance @merch-on @local-sign-in · creates its own product, hides it at the end · not mocked · local and docker only. Same caching note as the block above.

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

### Merch catalogue contract, access and resilience (planned 2026-11-21)

Explored live on the Docker stack (all flags on): `GET /api/v1/product` answers a `PagedResponse` of summaries
(`slug`, `name`, `kind`, `priceCents`, `currency`, `photo`, `soldOut`), kind then name; `GET /api/v1/product/<slug>`
adds `description`, `photos` and `sizes` (`id`, `available`, `soldOut`); `GET /api/v1/product/photo/<hash>` serves the
image; `/api/v1/product/admin` answers 401 without a token; `/admin/shop` shows "Organiser sign-in". Seeded data gaps
are listed in the report that accompanied this plan (no wholly sold-out product, no product with more than one photo).

#### client should receive the merch catalogue ordered by kind and then name

- Covers: `#6001`
- Oracle: the app spec Part 2 ("Products are listed by kind (rashguards, shorts, t-shirts), then name") and the seeded kinds `Harp Rashguard` (rashguard), `Competition Shorts` (shorts), `Logo T-Shirt` (t-shirt). Not a calculation shared with the app.
- Steps:
  1. Given the merch shop is switched on
  2. When a client requests the merch catalogue
- Expected results:
  - Then the seeded rashguard is listed before the seeded shorts
  - And the seeded shorts are listed before the seeded t-shirt
  - And each seeded product carries its price in cents and its currency
- Why: the order is the shop window; a catalogue that put t-shirts before the flagship rashguard would change what a shopper sees first.

Test design: API · @acceptance @merch-on · seeded products · not mocked · default seed. Config grep-excludes `@merch-on` unless `MERCH_FLAG=on`; the Given step fails naming `MERCH_FLAG` when the real flag disagrees (the catalogue answers 404 with Merch off). Request `pageSize=100` and assert only the relative order of the three seeded products (`expectRelativeOrder`), never that they are the only products. Prices: `4500`, `3500`, `2500` cents, `EUR`. Needs the `ProductSummaryDto` Zod schema noted in the stock-count block above. This owns ordering, so the UI merch block asserts presence and relative order once and no more.

#### client should get a validation error on <param> when <param> <value> is out of range for the merch catalogue

- Covers: `#6001`
- Oracle: the same paging contract as the directory (`page` at least 1, `pageSize` 1 to 100) and the shared `OUT_OF_RANGE_PAGING_VALUES` data. Not a calculation shared with the app.
- Steps:
  1. Given the merch shop is switched on
  2. When a client requests the merch catalogue with <param> <value>
- Expected results:
  - Then the request is rejected because <param> is out of range
- Why: an unbounded page size on a public product list is a cheap way to make the shop slow for everyone.

Test design: API · @acceptance @merch-on · data-driven over `OUT_OF_RANGE_PAGING_VALUES` from `tests/features/common/testdata/invalid-values.ts` · not mocked · no data. Config grep-excludes `@merch-on` unless `MERCH_FLAG=on`; the Given step fails naming `MERCH_FLAG` on a mismatch. Observed: `page=0&pageSize=101` answers 400 `urn:bjjeire:validation-error` with `errors` entries `{field: "Page"|"PageSize", errorCode: "VALUE_OUT_OF_RANGE"}`; assert through `expectProblem` with `ValidationErrorCode.ValueOutOfRange`. Add a non-numeric case only if the generator finds the shared `INVALID_INTEGER_QUERY_VALUES` behave the same (not yet probed).

#### client should get not found for <resource> that does not exist

- Covers: `#6002`
- Oracle: the app's STC overlay `#6002` (a draft, hidden or unknown product answers 404) and the problem-document contract (`urn:bjjeire:not-found`). Not a calculation shared with the app.
- Steps:
  1. Given the merch shop is switched on
  2. When a client requests <resource> that does not exist
- Expected results:
  - Then the response is a not-found problem document
  - And it carries a trace id
- Why: the product page's "Product not found" screen depends on this answer being a clean 404 and not a 500 or an empty 200.

Test design: API · @acceptance @merch-on · data-driven over `a product` (`GET /api/v1/product/no-such-product-<unique>`) and `a photo` (`GET /api/v1/product/photo/` followed by 64 zeros) · not mocked · no data. Config grep-excludes `@merch-on` unless `MERCH_FLAG=on`; the Given step fails naming `MERCH_FLAG` on a mismatch. Assert with `expectProblem` (404, `ProblemType.NotFound`), never the `detail` wording. Observed on 2026-11-21: both answer 404 `urn:bjjeire:not-found` with `traceId`.

#### client should be refused <action> in the shop admin without signing in

- Covers: `#6017`
- Oracle: the app spec User Story 6 item 5 (a person who is not the organiser is refused) and `urn:bjjeire:unauthorized`. Not a calculation shared with the app.
- Steps:
  1. Given the merch shop is switched on
  2. And the seeded rashguard is published
  3. When a client asks for <action> without a token
- Expected results:
  - Then the response is an unauthorised problem document
- Why: a product admin route that answered without a token would let anyone reprice, publish or hide the shop.

Test design: API · @acceptance @merch-on · data-driven over `listing the organiser's products` (`GET /api/v1/product/admin`), `creating a product` (`POST /api/v1/product/admin` with a valid-looking body and a unique slug; the planned `POST /api/v1/product` does not exist in the contract, create is on the admin path) and `publishing a product` (`POST /api/v1/product/admin/<seeded rashguard id>/publish`) · not mocked · seeded `harp-rashguard` is only the target of a refused call, so it is never changed. Route shapes confirmed against the OpenAPI contract and the app spec `#6017`; the seeded rashguard id comes from a GET by slug. No "unchanged" claim is asserted: the list is a read, the rashguard is already published and a create makes an invisible draft, so only the 401 can prove the refusal. A signed-in non-organiser case needs a second identity and is not planned here (see report).

#### visitor should see the organiser sign-in when opening the shop admin without signing in

- Covers: `#6017`
- Oracle: the app spec User Story 6 (the organiser signs in to `/admin/shop`) and the observed gate: heading "Organiser sign-in". Not a calculation shared with the app.
- Steps:
  1. Given the merch shop is switched on
  2. When a signed-out visitor opens the shop admin
- Expected results:
  - Then the organiser sign-in is shown
  - And no product is listed
  - And no product management control is shown
- Why: the product admin must not render its controls, even disabled, to someone who is not the organiser.

Test design: UI · @acceptance @merch-on @local-sign-in · no data · not mocked · local and docker only (the `@local-sign-in` tag stays for now; the gate's Sign in button renders on every environment and only its message changes with the local sign-in). Use a signed-out context (no storage state from the agent seed). The admin address is `/admin/shop`, opened with `gotoRoute`.

#### visitor should still see the store directory when the merch cannot be loaded

- Covers: none (the app spec's Part 2 prose says Shop shows the directory without the section and without an error when products cannot be loaded; no requirement issue states it)
- Oracle: a fixed mock body (a server problem document on the catalogue) and a seeded store.
- Steps:
  1. Given the merch shop is switched on
  2. And the merch catalogue answers with a server error
  3. When a visitor opens Shop
- Expected results:
  - Then there is no "BJJ Éire merch" section
  - And no error message is shown
  - And a seeded store's card is listed
- Why: a failing optional merch feed must not take down the directory the visitor came for.

Test design: UI · @acceptance @merch-on · mocked (route `GET /api/v1/product` answered with a 500 problem document built with `parseMockBody`; the directory is not mocked) · default seed. This is one of the empty, error and retry states the data policy allows to be mocked. Assert the absence of the error alert by role, not a particular copy, since the directory's own error copy is separate.

#### visitor should see the merch section fit a phone

- Covers: `#6001`
- Oracle: the seeded rashguard (name, "€45.00") and the app spec ("Product photos are never cropped"). Not a calculation shared with the app.
- Steps:
  1. Given the merch shop is switched on
  2. When a visitor opens Shop on a phone
- Expected results:
  - Then the seeded rashguard's card is shown with its photo, name and price
  - And the page does not scroll sideways
- Why: most shoppers arrive on a phone, and a product grid that overflows the screen loses the sale.

Test design: UI · `@mobile` · `@acceptance` · `@merch-on` · seeded `harp-rashguard` · not mocked · phone viewport (mobile-iphone and mobile-galaxy projects), in its own `@mobile` describe. Config grep-excludes `@merch-on` unless `MERCH_FLAG=on`; the Given step fails naming `MERCH_FLAG` on a mismatch. The photo counts as shown once it has loaded (natural width above zero). Reuse the page-fits-screen assertion the existing phone scenarios use. No pixel tolerances: check horizontal overflow only. Cropping of photos is a visual rule better held by a snapshot baseline (not planned).

#### visitor should see a product page fit a phone

- Covers: `#6002`
- Oracle: the seeded rashguard (sizes S, M, L, XL; XL is sold out and still listed) and the app spec ("Product photos are never cropped"). Not a calculation shared with the app.
- Steps:
  1. Given the merch shop is switched on
  2. When a visitor opens Shop on a phone
  3. And the visitor opens the seeded rashguard
- Expected results:
  - Then the product page shows its sizes and its photo
  - And the page does not scroll sideways
- Why: a size picker or photo that overflows the phone screen loses the sale.

Test design: UI · `@mobile` · `@acceptance` · `@merch-on` · seeded `harp-rashguard` · not mocked · opened by clicking the card, not by address · in the same `@mobile` describe as the scenario above. Same flag handling and overflow assertion; the photo counts as shown once it has loaded.

### Basket and guest checkout (`#6005`, `#6006`, `#6010`–`#6012`, `#6026`, planned 2026-11-23, slice 3)

Behaviour: `bjjeire-java/specs/features/shop.md` Part 2 (User Story 7) and `specs/stc/shop/spec.md` § `#6005`–`#6012`.
The basket lives in the browser (`localStorage` `bjjeire-basket`, product, size and quantity only). Checkout is a guest
form: name, email and an address in the Republic of Ireland or Northern Ireland (a `BT` postcode). Paying leaves for
Stripe's hosted Checkout, which the suite cannot drive (`competitions.md` F26), so no block here completes a payment.
Starting a checkout holds stock for 30 minutes, so any block that reaches the payment page uses a product the test
creates as the organiser, never the seeded products, and hides it afterwards. Until the organiser's delivery-fee screen
ships (slice 4), delivery is free (`€0.00`) on every stack. Test ids: `basket-*`, `checkout-*`, `order-*`,
`product-add-to-basket*`. No test claims these blocks yet.

#### visitor should see the size they chose in the basket with its price and a running total

- Covers: `#6005`
- Oracle: the seeded rashguard's name, price and an in-stock size. Not a calculation shared with the app.
- Steps:
  1. Given the merch shop is switched on
  2. When a visitor chooses an in-stock size of the seeded rashguard and adds it to the basket twice
  3. And opens the basket
- Expected results:
  - Then the basket lists the rashguard in that size with a quantity of 2
  - And it shows the item price and a line total of twice that price
  - And the basket total equals the line total
  - And the basket icon in the navigation shows 2 items
- Why: the shopper must see what they are about to buy before they pay.

Test design: UI · @acceptance @merch-on · seeded `harp-rashguard` · not mocked · nothing reaches the API but reads. Start from an empty basket (clear `localStorage` in the fixture).

#### visitor should see the basket total follow a change of quantity

- Covers: `#6005`
- Oracle: the seeded rashguard's price.
- Steps:
  1. Given the merch shop is switched on
  2. And the visitor's basket holds one of an in-stock size of the seeded rashguard
  3. When the visitor raises its quantity to 2 in the basket
- Expected results:
  - Then the line total and the basket total are twice the price
- Why: a total that lags behind the quantity misstates what will be charged.

Test design: UI · @acceptance @merch-on · seeded `harp-rashguard` · not mocked. Seed the basket through the product page, not by writing `localStorage`.

#### visitor should see an item leave the basket when removing it

- Covers: `#6005`
- Oracle: the seeded `harp-rashguard` and `logo-t-shirt`.
- Steps:
  1. Given the merch shop is switched on
  2. And the visitor's basket holds the seeded rashguard and the seeded t-shirt
  3. When the visitor removes the t-shirt
- Expected results:
  - Then only the rashguard is left in the basket
  - And the basket total is the rashguard's line total
- Why: a shopper who changes their mind must not be charged for it.

Test design: UI · @acceptance @merch-on · seeded products · not mocked.

#### visitor should see the items, the delivery fee and the full amount before paying

- Covers: `#6006`
- Oracle: the seeded rashguard's price and the delivery fee the API reports (`GET /api/v1/order/delivery`; `€0.00` until slice 4).
- Steps:
  1. Given the merch shop is switched on
  2. And the visitor's basket holds one of the seeded rashguard
  3. When the visitor goes to checkout
- Expected results:
  - Then the order summary shows the items total, the delivery fee and their sum
  - And the pay button names that sum
  - And the visitor is asked for a name, an email and a delivery address
- Why: FR-009, the full amount before paying.

Test design: UI · @acceptance @merch-on · seeded `harp-rashguard` · not mocked · nothing is submitted.

#### visitor should be asked for a Northern Ireland postcode when choosing Northern Ireland

- Covers: `#6006`
- Oracle: the app spec (Northern Ireland postcodes start BT).
- Steps:
  1. Given the merch shop is switched on
  2. And the visitor is at checkout with one item in the basket
  3. When the visitor chooses Northern Ireland and gives the postcode "SW1A 1AA"
  4. And asks to pay
- Expected results:
  - Then the form says a Northern Ireland postcode starting with BT is needed
  - And the visitor stays on the checkout page
- Why: FR-017, BJJ Éire delivers only to the Republic of Ireland and Northern Ireland.

Test design: UI · @acceptance @merch-on · seeded `harp-rashguard` · not mocked · the form refuses it before any request.

#### client should be refused delivery to an address outside Ireland and Northern Ireland

- Covers: `#6006`
- Oracle: ADR-0016 and the app's STC overlay `#6006` (`urn:bjjeire:delivery-not-available`).
- Steps:
  1. Given the merch shop is switched on
  2. When a client with no token starts a checkout for one seeded rashguard to an address in <country> <postcode>
- Expected results:
  - Then the checkout is refused because BJJ Éire does not deliver there
  - And no payment page is returned
- Why: an address the shop cannot deliver to must never reach payment.

Test design: API · @acceptance @merch-on · data-driven over `GB` with `SW1A 1AA` and `FR` with no postcode · `409 urn:bjjeire:delivery-not-available` · not mocked · nothing is held (the address is checked before any stock).

#### visitor should leave for the payment page without being asked to sign in

- Covers: `#6012`, `#6006`
- Oracle: the product the test creates; Stripe's hosted Checkout origin.
- Steps:
  1. Given the organiser has published a product with stock (setup)
  2. And a visitor who is not signed in has one in their basket
  3. When the visitor gives a name, an email and an Irish address, accepts the terms and asks to pay
- Expected results:
  - Then the visitor is taken to Stripe's payment page
  - And at no point was the visitor asked to sign in or create an account
- Why: FR-016, anyone can buy as a guest.

Test design: UI · @acceptance @merch-on @local-sign-in @stripe-test · creates its own product (unique slug) as the organiser and hides it afterwards; the order it starts holds that product's stock for 30 minutes and is never paid · not mocked · local and docker only, with Stripe test keys. Stop at the `checkout.stripe.com` navigation; do not interact with Stripe's page.

#### visitor should be told an item sold out before paying

- Covers: `#6010`
- Oracle: the product the test creates.
- Steps:
  1. Given the organiser has published a product with stock in size M (setup)
  2. And a visitor has one of size M in their basket
  3. When the organiser sets the stock of M to 0
  4. And the visitor opens the basket
- Expected results:
  - Then the line is marked sold out
  - And the visitor cannot go on to checkout until they remove it
- Why: `#6010`, the shopper is told what changed before they pay.

Test design: UI · @acceptance @merch-on @local-sign-in · creates its own product, hides it at the end · not mocked · local and docker only. Same caching note as the organiser blocks above. The checkout-time half (`basket-changed` listing each line) is owned by the app's integration tests (`#6010` T2, T4).

#### visitor should see "Order not found" when opening an order link with a wrong key

- Covers: `#6011`
- Oracle: the app's STC overlay `#6011` (a wrong, missing or other order's key reads like an unknown order).
- Steps:
  1. Given the merch shop is switched on
  2. When a visitor opens an order address whose link key is wrong
- Expected results:
  - Then the page says "Order not found"
  - And no order detail is shown
- Why: FR-015, nobody but the holder of the link can see an order.

Test design: UI · @acceptance @merch-on · an order id that exists nowhere and a made-up key · not mocked · creates nothing. The API half (404 for a wrong, missing or other order's key) is owned by `OrderAccessIT` in the app repo.

#### visitor should see no basket while merch is switched off

- Covers: `#6026`
- Oracle: ADR-0016 and the app's STC overlay `#6026`.
- Steps:
  1. Given the merch shop is switched off
  2. When a visitor opens Shop
  3. And opens the basket address directly
- Expected results:
  - Then the navigation shows no basket
  - And the basket address does not show a basket
- Why: no part of the shop is reachable before the owner switches it on.

Test design: UI · @acceptance · the default `Merch` flag (off) · not mocked. Same flag handling as "visitor should see only the store directory on Shop while merch is switched off".

### Basket limits, persistence and delivery contract (planned 2026-11-23, slice 3)

Probed on the Docker stack with every flag on: `GET /api/v1/order/delivery` answers 200 with no token, body
`{deliveryFeeCents: 0, currency: "EUR", countries: ["IE", "GB-NIR"]}`; `GET /api/v1/product/photo/<hash>` answers 200
`image/png` with `cache-control: max-age=31536000, public, immutable`; `GET /api/v1/order/admin` answers 401 without a token.
Rules from `specs/stc/shop/spec.md` § `#6005`: a line holds at most 10, the basket at most 20, never more than is available.
The seeded rashguard has S 10, M 10, L 8 available. No test claims these blocks yet.

#### visitor should not be able to put more of a size in the basket than is available

- Covers: `#6005`
- Oracle: the seeded rashguard's size L, 8 available (below the line cap of 10). Not a calculation shared with the app.
- Steps:
  1. Given the merch shop is switched on
  2. And the visitor's basket holds one of size L of the seeded rashguard
  3. When the visitor raises its quantity as far as the basket allows
- Expected results:
  - Then the quantity stops at 8
  - And the control to raise it further is disabled
  - And the line total is eight times the price
- Why: a basket that accepts more than is in stock promises a sale the shop cannot fill.

Test design: UI · @acceptance @merch-on · seeded `harp-rashguard`, size L · not mocked · default seed. Raise via the quantity control, not by writing `localStorage`; the seeded stock is never changed by any scenario, so 8 is stable. Do not also assert the 10-line cap in the UI; the API block below owns it.

#### visitor should still have their basket after reloading the page

- Covers: `#6005`
- Oracle: the seeded rashguard and the item the test adds. The basket is kept in this browser.
- Steps:
  1. Given the merch shop is switched on
  2. And the visitor has added an in-stock size of the seeded rashguard to the basket
  3. When the visitor reloads the page
  4. And opens the basket
- Expected results:
  - Then the basket lists the rashguard in that size with a quantity of 1
  - And the basket icon in the navigation shows 1 item
- Why: a shopper who loses the basket when a tab refreshes will not rebuild it.

Test design: UI · @acceptance @merch-on · seeded `harp-rashguard` · not mocked · default seed. Each test has its own browser context, so the stored basket never leaks between tests. Add through the product page.

#### visitor should see an empty basket with a way back to Shop when nothing has been added

- Covers: `#6005`
- Oracle: the app spec (the basket is empty until something is added). Not a calculation shared with the app.
- Steps:
  1. Given the merch shop is switched on
  2. When a visitor with an empty basket opens the basket address
- Expected results:
  - Then the page says the basket is empty
  - And it offers a link back to Shop, which leads to `/shop`
  - And no checkout control is offered
- Why: a visitor who follows a stale basket link must not meet a blank page or a pay button with nothing to pay for.

Test design: UI · @acceptance @merch-on · no data · not mocked · default seed. Not probed live (the browser seed pins `Merch` off, so the merch screens redirect); the generator confirms the copy and the test ids (`basket-*`) when rehearsing, and asserts by role and test id, not copy where it varies.

#### client should be refused a checkout whose quantities are out of bounds <case>

- Covers: `#6005`
- Oracle: the app's STC overlay `#6005` (`POST /api/v1/order` refuses a quantity of 0 with 400 and more than the basket cap with 409 `basket-too-large`). Not a calculation shared with the app.
- Steps:
  1. Given the merch shop is switched on
  2. When a client with no token starts a checkout for <case> of the seeded rashguard to an Irish address
- Expected results:
  - Then the checkout is refused
  - And no payment page is returned
- Why: the browser basket is only a convenience; the server must stop an oversized or empty order that someone sends by hand.

Test design: API · @acceptance @merch-on · data-driven over `a quantity of 0` (400 validation error) and `21 of one size` (409 `urn:bjjeire:basket-too-large`) · seeded `harp-rashguard` (id from a GET by slug, size `S`) · not mocked · nothing is held (both are refused before any stock is taken). Assert through `expectProblem` (status and `type`), never on `detail`. The exact `type` for the 400 and the request body shape are not probed live; the generator confirms them against the OpenAPI contract first. If the contract needs a delivery address in the body, use the Irish one from the delivery-refusal block above, which proves the address is accepted first.

#### client should receive the delivery fee and the countries the shop delivers to

- Covers: `#6006`
- Oracle: the app spec ("The Republic of Ireland and Northern Ireland only, for one flat fee per order") and the slice-3 note that delivery is free until slice 4. Not a calculation shared with the app.
- Steps:
  1. Given the merch shop is switched on
  2. When a client requests the delivery fee without a token
- Expected results:
  - Then the fee is zero euro
  - And the shop delivers to the Republic of Ireland and Northern Ireland and nowhere else
- Why: the checkout page's "free delivery" and its country list both come from this one answer.

Test design: API · @acceptance @merch-on · no data · not mocked · default seed. `GET /api/v1/order/delivery`: assert `currency` `EUR` and `countries` equal to exactly `IE` and `GB-NIR` (as a set). Assert the fee as `0` only while slice 4 has not shipped; when the organiser's fee screen lands, change the oracle to the fee the test sets (it must then create and restore its own value), and never assert a stale `0`. Needs a Zod schema from the generated contract if it exports one; otherwise parse with a local `z.object` in `src/api/features/stores/`.

#### client should receive a product photo as a long-lived image

- Covers: `#6002`
- Oracle: the seeded rashguard's photo hash read from its product page, and the app spec ("Product photos are never cropped", so served as uploaded). Not a calculation shared with the app.
- Steps:
  1. Given the merch shop is switched on
  2. When a client requests the seeded rashguard's photo
- Expected results:
  - Then the response is an image
  - And the image may be cached for a year without revalidating
- Why: photos are the heaviest thing on Shop; a photo answered without a long cache makes every visit re-download them.

Test design: API · @acceptance @merch-on · seeded `harp-rashguard` (hash taken from `photos[0]` of `GET /api/v1/product/harp-rashguard`, never hard-coded) · not mocked · default seed. Observed: 200, `content-type: image/png`, `cache-control: max-age=31536000, public, immutable`. Assert `content-type` starts `image/` and `cache-control` contains `immutable` and `max-age=31536000`; do not pin the byte length. The not-found photo case is owned by the existing "client should get not found for <resource>" block.

## Held for a product decision

Basket and guest checkout (slice 3, planned 2026-11-23). These need a payment completed on Stripe's hosted Checkout,
which the suite cannot drive (`competitions.md` F26). Lower tiers own them: the app's `OrderWebhookIT`,
`OrderAccessIT` and `order-page.integration.test.tsx`, with the recording Stripe fake. Unblock with a way to complete a
test-mode payment from the suite (Stripe's test helpers, or a signed test event sent to the shop webhook).

- **shopper should get a confirmed order and a receipt after paying** (`#6007`): stock of each size goes down by the quantity bought, and one mail lists the items, the amount paid, the delivery address and the order link.
- **shopper should be charged nothing and see the stock back on sale after leaving the payment page** (`#6008`): the order shows "Not paid" with "Back to basket" once Stripe expires the session; until then "Return to payment" reopens the same page.
- **shopper should see their order's items, amount paid, delivery details and status from the link in their receipt** (`#6011`): needs a confirmed order and its emailed key.

## Rejected

- `visitor should see stores ordered by name` · Why not: API scenario 2 owns ordering;
  the UI renders API order.

## Findings

- **F2 (guarded)**: one long unbroken word pushed the whole page sideways on a phone.
  Source: `specs/exploration/2026-10-31-stores-review.md`. Guarded by scenario UI 9.
- **F1, F3–F5**: see the same report (F1 resolved 2026-10-31; F3 is the shared header,
  tracked in the gyms report; F4 and F5 are copy and heading findings for the app repo).
